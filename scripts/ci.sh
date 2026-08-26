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
  install-deps) bash "$DIR/ci/install-deps.sh" "$@" ;;
  lint-and-report) bash "$DIR/ci/lint-and-report.sh" "$@" ;;
  check-worker-changes) bash "$DIR/ci/check-worker-changes.sh" "$@" ;;
  check-and-publish-worker) bash "$DIR/ci/check-and-publish-worker.sh" "$@" ;;
  build-frontend) bash "$DIR/ci/build-frontend.sh" "$@" ;;
  check-npm-version) bash "$DIR/ci/check-npm-version.sh" "$@" ;;
  *)
    echo "Unknown action: $ACTION" >&2
    exit 1
    ;;
esac
