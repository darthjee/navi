#!/bin/bash
set -e

LAST_TAG=$(git describe --tags --abbrev=0 --match='worker-*' --match='[0-9]*.[0-9]*.[0-9]*' 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
  echo "No previous release tag found — worker release recommended"
  exit 0
fi
if git diff --quiet "$LAST_TAG"..HEAD -- worker/; then
  echo "No changes in worker/ since $LAST_TAG — skipping"
  exit 0
else
  echo "WARNING: worker/ has changes since $LAST_TAG"
  echo "A worker release (worker-x.y.z tag) should be created before or alongside this navi release"
  echo "Run: scripts/bump_version.sh worker [version]"
  exit 0
fi
