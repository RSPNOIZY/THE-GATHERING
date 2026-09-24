#!/bin/bash
TS=$(date '+%Y-%m-%d %H:%M:%S')
GABRIEL="http://localhost:7777"
echo "[$TS] AirPlay END" >> /tmp/noizy-airplay.log
curl -s -X POST "$GABRIEL/memcell/airplay:session" \
  -H "Content-Type: application/json" \
  -d "{\"value\": {\"status\": \"stopped\", \"ts\": \"$TS\"}}" \
  > /dev/null 2>&1
