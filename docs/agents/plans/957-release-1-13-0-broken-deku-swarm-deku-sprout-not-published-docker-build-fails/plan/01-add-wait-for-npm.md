# Add wait-for-npm.sh
Add a reusable script that blocks until npm serves a given package version. Packages show up on npm up to about a minute after `npm publish` returns, and the Docker build failed inside that gap.

`scripts/ci/wait-for-npm.sh <pkg> <version>`:
- `set -e`. Validate that both arguments are present; print usage and exit 1 otherwise.
- Loop: `npm view "<pkg>@<version>" version --prefer-online`. If its output equals `<version>`, print `<pkg>@<version> is available on npm` and exit 0.
- Otherwise sleep `WAIT_FOR_NPM_INTERVAL` (default `10`) seconds and retry, up to `WAIT_FOR_NPM_TIMEOUT` (default `300`) seconds in total. The env overrides exist so the manual test in step 05 can use a short timeout.
- On timeout, print `<pkg>@<version> published but not visible on npm after <timeout>s` to stderr and exit 1.
- Print one progress line per attempt so the CircleCI log shows it is waiting rather than hung.

Register it in the `scripts/ci.sh` dispatcher as `wait-for-npm) bash "$DIR/ci/wait-for-npm.sh" "$@" ;;`.

## Files to Change
- `scripts/ci/wait-for-npm.sh` — new script.
- `scripts/ci.sh` — add the `wait-for-npm` action.
