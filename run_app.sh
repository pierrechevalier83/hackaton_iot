#!/bin/sh
echo $EDISON_HOST
ssh -t -t root@"$EDISON_HOST" "cd /node_app_slot/hackaton_iot && git pull && node main.js"
