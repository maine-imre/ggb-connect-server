/// <reference path="node-geogebra.d.ts" />

import { GGBPlotter } from 'node-geogebra';
import { EventEmitter } from 'events';

import { ActiveSession } from './types';
import { GGBConnectDatabase } from './database';

import * as SocketIo from 'socket.io';

export class GGBConnectApp {
  private sessions: Map<string, ActiveSession>;

  constructor(private db: GGBConnectDatabase, private io: SocketIo.Server) {
    this.sessions = new Map<string, ActiveSession>();
  }

  public getSession(sessionId: string): ActiveSession | undefined {
    return this.sessions.get(sessionId);
  }

  public async handshake(sessionId: string, version: string) {
    /* Create session */
    const sess = await this.db.getSession(sessionId, version);

    /* Add session to store */
    const plotter = new GGBPlotter({ ggb: 'local' });

    this.sessions.set(sessionId, {
      plotter,
      id: sessionId,
    });

    /* Set perspective and add event listeners */
    const page = await plotter.pagePromise;

    page.exposeFunction('addListener', (...args: any[]) => {
      this.io.to(sessionId).emit('add', ...args);
    });
    page.exposeFunction('removeListener', (...args: any[]) => {
      this.io.to(sessionId).emit('remove', ...args);
    });
    page.exposeFunction('updateListener', async (objName: string) => {
      const obj = await page.evaluate(
        (objName) => {
          return window.ggbApplet.getCommandString(objName);
        },
        objName,
      );

      this.io.to(sessionId).emit('update', obj);
    });
    page.exposeFunction('renameListener', (...args: any[]) => {
      this.io.to(sessionId).emit('rename', ...args);
    });

    const window: any = {};

    page.evaluate(() => {
      window.ggbApplet.setPerspective('T');
      window.ggbApplet.registerAddListener('addListener');
      window.ggbApplet.registerRemoveListener('removeListener');
      window.ggbApplet.registerUpdateListener('updateListener');
      window.ggbApplet.registerRenameListener('renameListener');
    });

    /* Done */
    return {
      sessionId,
    };
  }

  public async command(sessionId: string, command: string): Promise<boolean> {
    /* Get plotter or return false if not found */
    const session = this.getSession(sessionId);

    if (session === undefined) return false;
    if (session.plotter === undefined) return false;

    /* Eval command */
    await session.plotter.evalGGBScript([command]);

    return true;
  }

  public async exec(sessionId: string, prop: string, args: string[]): Promise<boolean> {
    /* Get plotter or return false if not found */
    const session = this.getSession(sessionId);

    if (session === undefined || session.plotter === undefined) {
      return false;
    }

    /* Eval command */
    const page = await session.plotter.pagePromise;
    const window: { [name: string]: any } = {};

    const result = await page.evaluate(
      (prop, args) => {
        const func = window.ggbApplet[prop];

        return (typeof func === 'function') ? func.apply(window.ggbApplet, args) : null;
      },
      prop,
      args,
    );

    return true;
  }

  public async getBase64(sessionId: string): Promise<string | null> {
    /* Get plotter */
    const session = this.getSession(sessionId);

    if (session === undefined) return null;
    if (session.plotter === undefined) return null;

    /* Export base64 in ggb format */
    return session.plotter.exportGGB64();
  }

  public async getXml(sessionId: string): Promise<string | null> {
    /* Get plotter */
    const session = this.getSession(sessionId);

    if (session === undefined) return null;
    if (session.plotter === undefined) return null;

    /* Export in XML format */
    const page = await session.plotter.pagePromise;
    const window: any = {};
    return page.evaluate(() => {
      return window.ggbApplet.getXML();
    });
  }

  public async getPNG(sessionId: string): Promise<Buffer | null> {
    /* Get plotter */
    const session = this.getSession(sessionId);

    if (session === undefined) return null;
    if (session.plotter === undefined) return null;

    /* Export base64 in ggb format */
    return session.plotter.exportPNG(true, 90);
  }

  public async saveBase64(sessionId: string): Promise<string | null> {
    /* Get base64 document */
    const doc = await this.getBase64(sessionId);

    if (doc === null) return null;

    /* Write to database and return */
    await this.db.updateDoc(sessionId, doc);
    return doc;
  }

  public async saveXml(sessionId: string): Promise<string | null> {
    /* Get base64 document */
    const doc = await this.getXml(sessionId);

    if (doc === null) return null;

    /* Write to database and return */
    await this.db.updateDoc(sessionId, doc);
    return doc;
  }

  public async release(sessionId: string): Promise<boolean> {
    /* Get plotter */
    const session = this.getSession(sessionId);

    if (session === undefined) return false;
    if (session.plotter === undefined) return false;

    /* Release plotter and remove session */
    await session.plotter.release();
    this.sessions.delete(sessionId);
    return true;
  }
}
