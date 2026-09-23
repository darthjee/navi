#!/bin/bash
set -e

DEKU_SPROUT_VERSION="${CIRCLE_TAG#deku-sprout-}"
PACKAGE_VERSION=$(node -p "require('./logger/package.json').version")

FAILED=0

if [ "$DEKU_SPROUT_VERSION" != "$PACKAGE_VERSION" ]; then
  echo "ERROR: Git tag ($CIRCLE_TAG) does not match logger/package.json version ($PACKAGE_VERSION)"
  FAILED=1
fi

if [ "$FAILED" = "1" ]; then
  exit 1
fi

echo "All versions match: $CIRCLE_TAG"
