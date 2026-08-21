#!/bin/bash
set -e

cd frontend && yarn install
yarn build
cd - > /dev/null
cp -r frontend/dist/. source/static/
sed -i 's/"deku-swarm": "file:..\//"deku-swarm": "^/' source/package.json
