#!/bin/bash
set -e

PATH_TO_PUBLISH=$1

echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
cd "$PATH_TO_PUBLISH"; npm publish --access public
