#!/bin/sh
echo $EDISON_HOST
ssh -t -t root@"$EDISON_HOST" "cd /node_app_slot/hackaton_iot/ && git checkout master && git pull && NODE_ENV=production npm install && cd dist && node main"
