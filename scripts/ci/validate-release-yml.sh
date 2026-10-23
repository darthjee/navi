#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$DIR/../.." && pwd)"

bash "$DIR/install-deps.sh" "$REPO_ROOT/scripts/release" true
node "$REPO_ROOT/scripts/release/bin/validate-release-yml.js" "$REPO_ROOT"
