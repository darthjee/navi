#!/bin/bash
# Pushes the extra GitHub tag of one npm package of release.yml
# (`<tag_prefix><version>`, e.g. sprout-0.3.1, swarm-1.12.1,
# node_client-0.2.5) on the commit being built.
#
# Usage: push-release-tag.sh <release.yml package name>
#
# Run by the push-tag-<package> CircleCI jobs, only after the package's
# release job actually published it (the skip-unless-released command halts
# the job otherwise).
#
# Flow:
#   1. fail unless GITHUB_TOKEN is set (skipped with DRY_RUN=1);
#   2. resolve the package's folder and tag prefix from release.yml
#      (scripts/lib/release_package_info.sh); fail when it has no
#      tag_prefix (navi-hey and the Docker images get no extra tag);
#   3. TAG=<tag_prefix><version of <folder>/package.json>;
#   4. skip when TAG already exists locally or on origin (idempotent);
#   5. create the annotated TAG on HEAD and push only that tag.
#
# Env:
#   DRY_RUN=1     print the tag that would be pushed instead of pushing it
#   GITHUB_TOKEN  required unless DRY_RUN=1: fine-grained PAT with
#                 Contents: Read and write on darthjee/navi, used to push
#                 the tag (see docs/agents/release-token.md)
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$DIR/../.." && pwd)"

PACKAGE=$1

if [ -z "$PACKAGE" ]; then
  echo "Usage: $0 <release.yml package name>" >&2
  exit 1
fi

# shellcheck source=../lib/package_bump_check.sh
source "$DIR/../lib/package_bump_check.sh"
# shellcheck source=../lib/release_package_info.sh
source "$DIR/../lib/release_package_info.sh"

# --- token check (runs before anything else) ---
check_token() {
  if [ "$DRY_RUN" = "1" ]; then
    return 0
  fi

  if [ -z "${GITHUB_TOKEN:-}" ]; then
    echo "GITHUB_TOKEN is required to push release tags" >&2
    exit 1
  fi
}

resolve() {
  local version

  bash "$DIR/install-deps.sh" "$REPO_ROOT/scripts/release" true

  read_package_info "$PACKAGE" "$REPO_ROOT"

  if [ -z "$INFO_TAG_PREFIX" ]; then
    echo "$PACKAGE has no tag_prefix in release.yml — no extra tag to push" >&2
    exit 1
  fi

  version=$(package_bump_read_version < "$REPO_ROOT/$INFO_FOLDER/package.json")
  TAG="$INFO_TAG_PREFIX$version"
}

# --- git tag push (idempotent) ---
push_tag() {
  cd "$REPO_ROOT"

  if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1 \
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
  git push "https://x-access-token:${GITHUB_TOKEN}@github.com/darthjee/navi.git" "refs/tags/$TAG"
}

check_token
resolve
push_tag
