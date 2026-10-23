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
  release-npm) bash "$DIR/ci/release-npm-package.sh" "$@" ;;
  build-frontend) bash "$DIR/ci/build-frontend.sh" "$@" ;;
  pin-local-deps) bash "$DIR/ci/pin-local-deps.sh" "$@" ;;
  wait-for-npm) bash "$DIR/ci/wait-for-npm.sh" "$@" ;;
  validate-release-yml) bash "$DIR/ci/validate-release-yml.sh" "$@" ;;
  cascade-bump-check) bash "$DIR/ci/cascade-bump-check.sh" "$@" ;;
  release-docker) bash "$DIR/ci/release-docker-image.sh" "$@" ;;
  docker-hub-tag-exists) bash "$DIR/ci/docker-hub-tag-exists.sh" "$@" ;;
  released) bash "$DIR/ci/released.sh" "$@" ;;
  push-tag) bash "$DIR/ci/push-release-tag.sh" "$@" ;;
  *)
    echo "Unknown action: $ACTION" >&2
    exit 1
    ;;
esac
