#!/bin/bash
set -e

PACKAGE_VERSION=$(node -p "require('./source/package.json').version")
README_VERSION=$(grep -oP '(?<=\*\*Current Version:\*\* \[)[\d.]+' README.md)

FAILED=0

if [ "$CIRCLE_TAG" != "$PACKAGE_VERSION" ]; then
  echo "ERROR: Git tag ($CIRCLE_TAG) does not match package.json version ($PACKAGE_VERSION)"
  FAILED=1
fi

if [ "$CIRCLE_TAG" != "$README_VERSION" ]; then
  echo "ERROR: Git tag ($CIRCLE_TAG) does not match README.md version ($README_VERSION)"
  FAILED=1
fi

if [ "$FAILED" = "1" ]; then
  exit 1
fi

echo "All versions match: $CIRCLE_TAG"
