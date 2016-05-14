#!/bin/sh
echo $EDISON_HOST
git checkout -b deploy
mkdir -p dist
npm run build
git add -A
git add -f dist/*
git commit -a -m 'deploying'
git push -f --set-upstream origin deploy
ssh -t -t root@"$EDISON_HOST" "cd /node_app_slot/hackaton_iot && git pull && git checkout deploy && npm run run_device"
git branch -D deploy
git push origin --delete deploy