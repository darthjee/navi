#!/bin/bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION=$1
shift

case "$ACTION" in
  setup-dev) bash "$DIR/ci/setup-dev.sh" "$@" ;;
  publish) bash "$DIR/ci/publish.sh" "$@" ;;
  coverage) bash "$DIR/ci/coverage.sh" "$@" ;;
  coverage-final) bash "$DIR/ci/coverage-final.sh" "$@" ;;
  *)
    echo "Unknown action: $ACTION" >&2
    exit 1
    ;;
esac
