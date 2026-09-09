#!/bin/bash
#
# darthjee/navi-hey-test entrypoint — dispatches the downstream extension test
# harness. See docs/guides/navi/extending-navi.md.
#
#   all       (default)  backend suite then frontend suite, as two separate
#                        node processes; non-zero exit if either fails
#   backend              backend Jasmine suite only
#   frontend             frontend Jasmine suite only (jsdom helper + jsx loader)
#   lint                 eslint over the mounted src/ + tests/ (lenient)
#   sh                   interactive shell inside the image
#
# Any suite command also accepts --coverage to wrap the run in c8, using the
# baked config scoped to the author's src/**.

set -uo pipefail

BAKED=/opt/navi-hey-test
SOURCE_NM=/navi/source/node_modules
FRONTEND_NM=/navi/frontend/node_modules

command="all"
if [ "$#" -gt 0 ]; then
  case "$1" in
    -*) : ;;
    *) command="$1"; shift ;;
  esac
fi

coverage=0
for arg in "$@"; do
  [ "$arg" = "--coverage" ] && coverage=1
done

run_backend() {
  cd /work || return 1
  if [ "$coverage" -eq 1 ]; then
    "$SOURCE_NM/.bin/c8" \
      --config="$BAKED/c8.json" \
      --reports-dir=/work/coverage/backend \
      --temp-directory=/work/coverage/backend/tmp \
      "$SOURCE_NM/.bin/jasmine" --config="$BAKED/jasmine.backend.json"
  else
    "$SOURCE_NM/.bin/jasmine" --config="$BAKED/jasmine.backend.json"
  fi
}

run_frontend() {
  cd /work || return 1
  if [ "$coverage" -eq 1 ]; then
    "$FRONTEND_NM/.bin/c8" \
      --config="$BAKED/c8.json" \
      --reports-dir=/work/coverage/frontend \
      --temp-directory=/work/coverage/frontend/tmp \
      node --import "$BAKED/loader.js" \
      "$FRONTEND_NM/.bin/jasmine" --config="$BAKED/jasmine.frontend.json"
  else
    node --import "$BAKED/loader.js" \
      "$FRONTEND_NM/.bin/jasmine" --config="$BAKED/jasmine.frontend.json"
  fi
}

run_lint() {
  cd /work || return 1
  "$FRONTEND_NM/.bin/eslint" --config "$BAKED/eslint.config.mjs" src tests
}

case "$command" in
  all)
    run_backend; backend_status=$?
    run_frontend; frontend_status=$?
    echo
    echo "backend suite:  exit ${backend_status}"
    echo "frontend suite: exit ${frontend_status}"
    { [ "$backend_status" -eq 0 ] && [ "$frontend_status" -eq 0 ]; } || exit 1
    ;;
  backend)  run_backend ;;
  frontend) run_frontend ;;
  lint)     run_lint ;;
  sh)       exec /bin/bash "$@" ;;
  *)
    echo "navi-hey-test: unknown command '${command}'" >&2
    echo "usage: navi-hey-test [all|backend|frontend|lint|sh] [--coverage]" >&2
    exit 2
    ;;
esac
