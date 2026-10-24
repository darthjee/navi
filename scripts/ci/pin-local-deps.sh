#!/bin/bash
set -e

PACKAGE_JSON=source/package.json

DEKU_SWARM_VERSION=$(node -p "require('./deku-swarm/package.json').version")
DEKU_SPROUT_VERSION=$(node -p "require('./deku-sprout/package.json').version")

sed -i "s/\"deku-swarm\": \"file:[^\"]*\"/\"deku-swarm\": \"$DEKU_SWARM_VERSION\"/" "$PACKAGE_JSON"
echo "Pinned deku-swarm to $DEKU_SWARM_VERSION"

sed -i "s/\"deku-sprout\": \"file:[^\"]*\"/\"deku-sprout\": \"$DEKU_SPROUT_VERSION\"/" "$PACKAGE_JSON"
echo "Pinned deku-sprout to $DEKU_SPROUT_VERSION"

if grep -q '"file:' "$PACKAGE_JSON"; then
  echo "Error: $PACKAGE_JSON still has local file: dependencies:" >&2
  grep -n '"file:' "$PACKAGE_JSON" >&2
  exit 1
fi
