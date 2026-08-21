#!/bin/bash
set -e

DIR=$1

cd "$DIR"
npm run lint
npm run report
