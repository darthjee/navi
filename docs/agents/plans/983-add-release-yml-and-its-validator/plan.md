# Plan: Add `release.yml` and its validator

Issue: [983-add-release-yml-and-its-validator.md](../../issues/983-add-release-yml-and-its-validator.md)

## Overview
Add a root `release.yml` describing the six releases and their dependency tree, plus a small Node package under `scripts/release/` that validates it against each folder's `package.json`. The package has jasmine specs, and three new CI jobs (`jasmine-release`, `checks-release` and `validate-release-yml`) run its specs, its lint and the validator on PR branches and tags.

## Context
Part of Epic #977. The cascade-bump test (#984), the npm and Docker release jobs (#986, #987) and the tag-push job (#988) will all read `release.yml`, so it must stay in sync with the real `package.json` files. Spec reference: `docs/agents/specs/release/packages.md#dependency-tree-releaseyml`.

Facts found while exploring:
- `source/package.json` (`navi-hey`) depends on `deku-sprout` (`file:../logger`) and `deku-swarm` (`file:../worker`).
- `clients/node/package.json` (`navi-hey-client`) depends on `deku-sprout` as `^0.3.0`, not `file:`.
- `logger/` and `worker/` declare no runtime dependencies.
- `navi-spec-support` appears only in `devDependencies` (`frontend/`, `dev/frontend/`) and is not a release.
- The packages are ESM (`"type": "module"`), tested with jasmine (`spec/support/jasmine.json`, `npm run coverage` via c8) and linted with eslint flat configs.
- The CI commands `install-deps`, `run-tests` and `lint-and-report` all take a `path`.

## Steps

- [01 — Add `release.yml`](plan/01-add-release-yml.md)
- [02 — Create the `scripts/release/` validator package](plan/02-validator-package.md)
- [03 — Wire the validator into CI](plan/03-ci-jobs.md)
- [04 — Document the new files](plan/04-docs.md)

## CI Checks
- `scripts/release`: `cd scripts/release && yarn install && npm run coverage` (CI job: `jasmine-release`)
- `scripts/release`: `scripts/ci.sh lint-and-report scripts/release` (CI job: `checks-release`)
- root: `scripts/ci.sh validate-release-yml` (CI job: `validate-release-yml`)

## Notes
- Out of scope: checking that every `depends_on` target exists, checking for cycles, the cascade-bump test (#984), and any change to the release jobs.
- Keep the same tag filters as the other test jobs (`*all-tags`). #985 later restricts tags to `X.Y.Z`.
- `release.yml` must stay readable by bash callers later on (#984 and #986 may call the Node package). Keep its shape flat: one map of packages, each with scalar fields and one list.
