#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$DIR/../.." && pwd)"

bash "$DIR/install-deps.sh" "$REPO_ROOT/scripts/release" true
git -C "$REPO_ROOT" fetch origin main --tags || true
node "$REPO_ROOT/scripts/release/bin/check-cascade-bumps.js" "$REPO_ROOT" "$@"
