#!/bin/sh
echo $EDISON_HOST
git checkout -B deploy
mkdir -p dist
npm run build
git add -A
git add -f dist/*
git commit -a -m 'deploying'
git push --set-upstream origin deploy
ssh -t -t root@"$EDISON_HOST" "cd /node_app_slot/hackaton_iot && git reset --hard origin/deploy && npm run run_device"
git checkout master
git branch -D deploy
git push origin --delete deploy