# Wire the validator into CI
- **`scripts/ci.sh`**: add a `validate-release-yml` action that runs `bash "$DIR/ci/validate-release-yml.sh" "$@"`.
- **`scripts/ci/validate-release-yml.sh`** (new, `set -e`):
  - installs `scripts/release` deps through `scripts/ci/install-deps.sh scripts/release true`;
  - runs `node scripts/release/bin/validate-release-yml.js "$REPO_ROOT"`.
- **`.circleci/config.yml`**: add three jobs, modeled on `jasmine-deku-sprout` and `checks-deku-sprout`. All use `executor: node-ci` and `filters: *all-tags`.
  - `jasmine-release`: `checkout`, `install-deps` and `run-tests` with `path: scripts/release`.
  - `checks-release`: `checkout`, `install-deps` and `lint-and-report` with `path: scripts/release`.
  - `validate-release-yml`: `checkout`, then `scripts/ci.sh validate-release-yml`.
  - Add `jasmine-release` to `coverage-final`'s `requires` list.
- Check that `scripts/ci/coverage.sh` and `scripts/ci/lint-and-report.sh` work with a nested path (`scripts/release`). They only `cd` into it, so they should; fix them if not.

## Files to Change
- `scripts/ci.sh` — new `validate-release-yml` action.
- `scripts/ci/validate-release-yml.sh` — new CI wrapper.
- `.circleci/config.yml` — three new jobs, their workflow entries, and `coverage-final.requires`.
