#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CHANGED=0

LAST_TAG=$(git describe --tags --abbrev=0 --match='deku-sprout-*' --match='[0-9]*.[0-9]*.[0-9]*' 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
  echo "No previous release tag found — deku-sprout release recommended"
  CHANGED=1
elif ! git diff --quiet "$LAST_TAG"..HEAD -- logger/; then
  echo "logger/ has changes since $LAST_TAG"
  CHANGED=1
else
  echo "No changes in logger/ since $LAST_TAG"
fi

if [ "$FORCE_DEKU_SPROUT_BUILD" = "true" ]; then
  echo "FORCE_DEKU_SPROUT_BUILD=true — forcing deku-sprout release"
  CHANGED=1
fi

if [ "$CHANGED" != "1" ]; then
  echo "Skipping deku-sprout release: no changes and force build not requested"
  exit 0
fi

DEKU_SPROUT_VERSION=$(node -p "require('./logger/package.json').version")
TAG="deku-sprout-$DEKU_SPROUT_VERSION"

# --- npm publish (independently idempotent) ---
if npm view "deku-sprout@$DEKU_SPROUT_VERSION" version >/dev/null 2>&1; then
  echo "deku-sprout@$DEKU_SPROUT_VERSION already exists on npm — skipping publish"
else
  echo "Publishing deku-sprout@$DEKU_SPROUT_VERSION to npm"
  bash "$DIR/../ci.sh" install-deps logger true
  bash "$DIR/../ci.sh" publish logger
fi

# --- git tag push (independently idempotent) ---
TAG_EXISTS=0
if git rev-parse "$TAG" >/dev/null 2>&1; then
  TAG_EXISTS=1
elif [ -n "$(git ls-remote --tags origin "refs/tags/$TAG" 2>/dev/null)" ]; then
  TAG_EXISTS=1
fi

if [ "$TAG_EXISTS" = "1" ]; then
  echo "Tag $TAG already exists — skipping tag push"
else
  echo "Creating and pushing tag $TAG"
  git config user.name "Navi CI"
  git config user.email "ci@navi.local"
  git tag -a "$TAG" -m "Release $TAG"
  git push "https://x-access-token:${GH_PUSH_TOKEN}@github.com/darthjee/navi.git" "$TAG"
fi
