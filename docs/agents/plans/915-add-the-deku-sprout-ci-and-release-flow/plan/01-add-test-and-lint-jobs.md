# Add jasmine-deku-sprout and checks-deku-sprout CircleCI jobs

Add the two per-package test/lint jobs for `logger/`, mirroring `jasmine-worker`/`checks-worker` exactly (same `node-ci` executor, same `install-deps`/`run-tests`/`lint-and-report` commands, just `path: logger`). Wire both into the `test-and-release` workflow with the shared `*all-tags` filter, and add `jasmine-deku-sprout` to `coverage-final`'s `requires` list so its coverage is included in the final Codacy report, the same way `jasmine-worker` is today.

## Files to Change

- `.circleci/config.yml` — add `jasmine-deku-sprout` and `checks-deku-sprout` job definitions (copy `jasmine-worker`/`checks-worker`, swap `path: worker` for `path: logger`); add both to the `jobs:` list in the `test-and-release` workflow with `filters: *all-tags`; append `jasmine-deku-sprout` to `coverage-final`'s `requires: [...]` list.
