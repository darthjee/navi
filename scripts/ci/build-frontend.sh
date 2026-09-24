#!/bin/bash
set -e

cd frontend && yarn install
yarn build
cd - > /dev/null
cp -r frontend/dist/. source/static/
