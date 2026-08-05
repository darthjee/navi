#!/bin/bash
set -e

CLIENT_VERSION="${CIRCLE_TAG#client-}"
PACKAGE_VERSION=$(node -p "require('./clients/node/package.json').version")
README_VERSION=$(grep -oP '(?<=\*\*Client Current Version:\*\* \[)[\d.]+' README.md)

FAILED=0

if [ "$CLIENT_VERSION" != "$PACKAGE_VERSION" ]; then
  echo "ERROR: Git tag ($CIRCLE_TAG) does not match clients/node/package.json version ($PACKAGE_VERSION)"
  FAILED=1
fi

if [ "$CLIENT_VERSION" != "$README_VERSION" ]; then
  echo "ERROR: Git tag ($CIRCLE_TAG) does not match README.md version ($README_VERSION)"
  FAILED=1
fi

if [ "$FAILED" = "1" ]; then
  exit 1
fi

echo "All versions match: $CIRCLE_TAG"
