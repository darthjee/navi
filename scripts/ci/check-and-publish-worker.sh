#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

CHANGED=0

LAST_TAG=$(git describe --tags --abbrev=0 --match='worker-*' --match='[0-9]*.[0-9]*.[0-9]*' 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
  echo "No previous release tag found — worker release recommended"
  CHANGED=1
elif ! git diff --quiet "$LAST_TAG"..HEAD -- worker/; then
  echo "worker/ has changes since $LAST_TAG"
  CHANGED=1
else
  echo "No changes in worker/ since $LAST_TAG"
fi

if [ "$FORCE_WORKER_BUILD" = "true" ]; then
  echo "FORCE_WORKER_BUILD=true — forcing worker release"
  CHANGED=1
fi

if [ "$CHANGED" != "1" ]; then
  echo "Skipping worker release: no changes and force build not requested"
  exit 0
fi

WORKER_VERSION=$(node -p "require('./worker/package.json').version")
TAG="worker-$WORKER_VERSION"

# --- npm publish (independently idempotent) ---
if npm view "deku-swarm@$WORKER_VERSION" version >/dev/null 2>&1; then
  echo "deku-swarm@$WORKER_VERSION already exists on npm — skipping publish"
else
  echo "Publishing deku-swarm@$WORKER_VERSION to npm"
  bash "$DIR/../ci.sh" install-deps worker true
  bash "$DIR/../ci.sh" publish worker
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
