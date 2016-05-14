#!/bin/sh
echo $EDISON_HOST
ssh root@"$EDISON_HOST" "cd /node_app_slot/hackaton_iot && git pull && node main.js"
