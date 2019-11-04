#!/bin/bash
ORIGIN="http://localhost:8080"
SID="e1d9fd91-745e-4299-b4ae-7bab36f408e7"

#node dist/socketTest.js "$SID"

curl -s "$ORIGIN/handshake?sessionId=$SID&version=9001"
curl -s -X POST "$ORIGIN/command" -d "sessionId=$SID&command=A=(1,2,3)"
curl -s -X POST "$ORIGIN/command" -d "sessionId=$SID&command=B=(5,7,-1)"
curl -s -X POST "$ORIGIN/command" -d "sessionId=$SID&command=C=(8,12,13)"
curl -s -X POST "$ORIGIN/command" -d "sessionId=$SID&command=f:Line(A,C)"
curl -s -X POST "$ORIGIN/command" -d "sessionId=$SID&command=g:Line(B,A)"
curl -s -X POST "$ORIGIN/command" -d "sessionId=$SID&command=f:Line(C,B)"
curl -s -X POST "$ORIGIN/command" -d "sessionId=$SID&command=C=(3,4,5)"
#curl -s -X POST "$ORIGIN/saveCurrSession" -d "sessionId=$SID" > /dev/null

read -p "Press [Enter] key to start backup..."
