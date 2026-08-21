#!/bin/bash
set -e

WORKER_VERSION="${CIRCLE_TAG#worker-}"
PACKAGE_VERSION=$(node -p "require('./worker/package.json').version")
README_VERSION=$(grep -oP '(?<=\*\*Worker Current Version:\*\* \[)[\d.]+' README.md)

FAILED=0

if [ "$WORKER_VERSION" != "$PACKAGE_VERSION" ]; then
  echo "ERROR: Git tag ($CIRCLE_TAG) does not match worker/package.json version ($PACKAGE_VERSION)"
  FAILED=1
fi

if [ "$WORKER_VERSION" != "$README_VERSION" ]; then
  echo "ERROR: Git tag ($CIRCLE_TAG) does not match README.md version ($README_VERSION)"
  FAILED=1
fi

if [ "$FAILED" = "1" ]; then
  exit 1
fi

echo "All versions match: $CIRCLE_TAG"
