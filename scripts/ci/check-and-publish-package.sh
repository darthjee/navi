#!/bin/bash
# Publishes a local package (worker/ -> deku-swarm, logger/ -> deku-sprout)
# whenever its package.json version is not on npm yet, and pushes the
# matching <tag-prefix><version> git tag.
#
# Usage: check-and-publish-package.sh <folder> <npm-package> <tag-prefix>
#
# Env:
#   SKIP_BUMP_CHECK=true  skip the forgotten-version-bump check
#   DRY_RUN=1             print what would be published/pushed instead of doing it
#   GITHUB_TOKEN          required unless DRY_RUN=1: fine-grained PAT with
#                         Contents: Read and write on darthjee/navi, used to
#                         push the release tag (see docs/agents/release-token.md)
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

FOLDER=$1
PACKAGE=$2
TAG_PREFIX=$3

if [ -z "$FOLDER" ] || [ -z "$PACKAGE" ] || [ -z "$TAG_PREFIX" ]; then
  echo "Usage: $0 <folder> <npm-package> <tag-prefix>" >&2
  exit 1
fi

# --- token check (runs before anything is published) ---
check_token() {
  if [ "$DRY_RUN" = "1" ]; then
    return 0
  fi

  if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "GITHUB_TOKEN is required to push release tags" >&2
    exit 1
  fi
}

read_version() {
  node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).version"
}

VERSION=$(read_version < "$FOLDER/package.json")
TAG="$TAG_PREFIX$VERSION"

# --- forgotten-bump check (git-only) ---
check_version_bump() {
  if [ "$SKIP_BUMP_CHECK" = "true" ]; then
    echo "SKIP_BUMP_CHECK=true — skipping bump check"
    return 0
  fi

  # Start from HEAD^ so the tag currently being built is never returned.
  local last_tag
  last_tag=$(git describe --tags --abbrev=0 --match="${TAG_PREFIX}*" --match='[0-9]*.[0-9]*.[0-9]*' HEAD^ 2>/dev/null || echo "")

  if [ -z "$last_tag" ]; then
    echo "No previous release tag found — skipping bump check"
    return 0
  fi

  if git diff --quiet "$last_tag"..HEAD -- "$FOLDER/lib" "$FOLDER/package.json"; then
    echo "No published files changed in $FOLDER/ since $last_tag"
    return 0
  fi

  local last_version
  last_version=$(git show "$last_tag:$FOLDER/package.json" 2>/dev/null | read_version 2>/dev/null || echo "")

  if [ "$last_version" = "$VERSION" ]; then
    echo "$FOLDER/ published files changed since $last_tag but version $VERSION was not bumped" >&2
    exit 1
  fi

  echo "$FOLDER/ changed since $last_tag and version was bumped (${last_version:-none} -> $VERSION)"
}

# --- publish decision (npm) ---
needs_publish() {
  local output status
  set +e
  output=$(npm view "$PACKAGE@$VERSION" version 2>&1)
  status=$?
  set -e

  if [ "$status" = "0" ] && [ "$output" = "$VERSION" ]; then
    echo "$PACKAGE@$VERSION already on npm — skipping publish"
    return 1
  fi

  if [ "$status" = "0" ] && [ -z "$output" ]; then
    # npm prints nothing (and exits 0) for a version missing from an existing package.
    return 0
  fi

  if echo "$output" | grep -qE 'E404|404 Not Found|is not in this registry|is not in the npm registry'; then
    return 0
  fi

  echo "npm view $PACKAGE@$VERSION failed:" >&2
  echo "$output" >&2
  exit 1
}

publish() {
  if [ "$DRY_RUN" = "1" ]; then
    echo "would publish $PACKAGE@$VERSION"
    return 0
  fi

  echo "Publishing $PACKAGE@$VERSION to npm"
  bash "$DIR/../ci.sh" install-deps "$FOLDER" true
  bash "$DIR/../ci.sh" publish "$FOLDER"
}

# --- git tag push (independently idempotent) ---
push_tag() {
  if git rev-parse "$TAG" >/dev/null 2>&1 \
    || [ -n "$(git ls-remote --tags origin "refs/tags/$TAG" 2>/dev/null)" ]; then
    echo "Tag $TAG already exists — skipping tag push"
    return 0
  fi

  if [ "$DRY_RUN" = "1" ]; then
    echo "would push tag $TAG"
    return 0
  fi

  echo "Creating and pushing tag $TAG"
  git config user.name "Navi CI"
  git config user.email "ci@navi.local"
  git tag -a "$TAG" -m "Release $TAG"
  git push "https://x-access-token:${GITHUB_TOKEN}@github.com/darthjee/navi.git" "$TAG"
}

check_token
check_version_bump

if needs_publish; then
  publish
fi

push_tag
