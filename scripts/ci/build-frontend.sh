#!/bin/bash
set -e

cd frontend && yarn install
yarn build
cd - > /dev/null
cp -r frontend/dist/. source/static/
WORKER_VERSION=$(node -p "require('./worker/package.json').version")
sed -i "s/\"deku-swarm\": \"file:[^\"]*\"/\"deku-swarm\": \"$WORKER_VERSION\"/" source/package.json
