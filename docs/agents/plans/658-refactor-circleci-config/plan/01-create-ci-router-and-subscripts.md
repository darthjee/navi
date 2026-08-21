# Create the CI router and sub-scripts

Create `scripts/ci.sh` as a thin router that dispatches to sub-scripts under `scripts/ci/*.sh`, and write the four sub-scripts that carry the shell logic currently inlined in `.circleci/config.yml`. This step only adds files — no job in `config.yml` is touched yet, so it can be written and reviewed independently of the YAML changes in later steps.

`scripts/ci.sh` takes an action name as `$1` and forwards the remaining arguments to the matching sub-script, resolved relative to its own location (so it works regardless of the caller's working directory):

```bash
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
```

Each sub-script keeps `set -e` and reproduces the existing inline shell exactly, only replacing the hard-coded `cd <path>;` prefix with an argument where the original step's directory varied by job:

- `scripts/ci/setup-dev.sh` — no arguments. Reproduces the "Copy common code from source" step body (`rm -rf dev/app/lib/common dev/app/spec/lib/common`, then `cp -r` for both `lib/common` and `spec/lib/common`), currently duplicated in `jasmine-dev` and `checks-dev`.
- `scripts/ci/publish.sh` — one argument, the target directory (`source` or `clients/node`). Reproduces the npm auth (`echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc`) and `npm publish --access public`, currently duplicated in `npm-publish` and `npm-publish-client` (and usable by `npm-publish-worker` in step 4).
- `scripts/ci/coverage.sh` — one optional argument, the directory to run in (default `.`). Reproduces the Codacy partial-upload command (`bash <(curl -Ls https://coverage.codacy.com/get.sh) report --partial -r coverage/lcov.info`), currently duplicated across `jasmine`, `jasmine-dev`, `jasmine-dev-frontend`, `jasmine-frontend`, `jasmine-client`, `jasmine-worker`.
- `scripts/ci/coverage-final.sh` — no arguments. Reproduces the `coverage-final` job's `bash <(curl -Ls https://coverage.codacy.com/get.sh) final`.

## Files to Change

- `scripts/ci.sh` — new router script (see body above).
- `scripts/ci/setup-dev.sh` — new, extracted from `jasmine-dev`/`checks-dev`'s "Copy common code from source" step.
- `scripts/ci/publish.sh` — new, extracted from `npm-publish`/`npm-publish-client`'s "Publish to npm" step.
- `scripts/ci/coverage.sh` — new, extracted from the "Upload coverage to Codacy (partial)" step duplicated in 6 jobs.
- `scripts/ci/coverage-final.sh` — new, extracted from the `coverage-final` job.

All five files need `chmod +x`.
