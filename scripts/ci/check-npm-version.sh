#!/bin/bash
set -e

PACKAGE_NAME=$1
PACKAGE_JSON=$2

VERSION=$(node -p "require('$PACKAGE_JSON').version")
if npm view "$PACKAGE_NAME@$VERSION" version 2>/dev/null; then
  echo "$PACKAGE_NAME@$VERSION already exists on npm — skipping publish"
  circleci-agent step halt
fi
