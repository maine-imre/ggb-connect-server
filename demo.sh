#!/bin/bash
ORIGIN="http://localhost:8080"
SID="c55d57d8-8624-11e9-bc42-526af7764f64"

node dist/socketTest.js "$SID" &

curl -s "$ORIGIN/handshake?sessionId=$SID&version=9001"
curl -s -X POST "$ORIGIN/command" -d "sessionId=$SID&command=A=(1,2,3)"
curl -s -X POST "$ORIGIN/command" -d "sessionId=$SID&command=B=(5,7,-1)"
curl -s -X POST "$ORIGIN/command" -d "sessionId=$SID&command=C=(8,12,13)"
curl -s -X POST "$ORIGIN/command" -d "sessionId=$SID&command=f:Line(A,C)"
curl -s -X POST "$ORIGIN/command" -d "sessionId=$SID&command=g:Line(B,A)"
curl -s -X POST "$ORIGIN/command" -d "sessionId=$SID&command=f:Line(C,B)"
curl -s -X POST "$ORIGIN/command" -d "sessionId=$SID&command=C=(3,4,5)"
curl -s -X POST "$ORIGIN/saveCurrSession" -d "sessionId=$SID" > /dev/null

