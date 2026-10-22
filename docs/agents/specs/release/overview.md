# Overview

[Back to the release spec](../release.md)

## Today

Releases are driven by several tag families in `.circleci/config.yml`, each with its own mechanics.

- **`X.Y.Z`** (e.g. `1.14.1`). The tag must match the `source/package.json` version (`scripts/check_tag_version.sh`, run by `check-version-tag`).
  - `check-and-publish-worker` and `check-and-publish-deku-sprout` (both via `scripts/ci/check-and-publish-package.sh`) publish `deku-swarm` and `deku-sprout` when their version is missing from npm, and push a `worker-<v>` / `deku-sprout-<v>` tag.
  - `npm-publish` publishes `navi-hey`, after every test job and both check-and-publish jobs.
  - `build-and-release` builds and pushes the `darthjee/navi-hey` image (`make release`).
  - Then `update-description`, `build-and-release-demo`, `build-and-release-demo-app` and `build-and-release-navi-hey-test`.
- **`client-X.Y.Z`** (e.g. `client-0.2.4`). `check-client-version-tag` (`scripts/check_client_tag_version.sh`), then `npm-publish-client` (`navi-hey-client`), then `build-and-release-client` (`darthjee/navi-hey-client`, `make release-client`), then `update-description-client`.
- **`worker-X.Y.Z` / `deku-sprout-X.Y.Z`**. Pushed by CI itself, and excluded from the test jobs (`ignore: /^(deku-sprout|worker)-.*/`).
- **Every other tag**, including `client-…`, still runs the full test suite.

So the client releases on its own tag, while the worker and the logger are only published when their version is missing from npm.

## Target

- Only an `X.Y.Z` tag triggers CI release mechanics. Every other tag triggers nothing, not even tests. PR branches run tests only. See [Tags](tags.md).
- On an `X.Y.Z` tag, every package has a release job. Each job releases its package only when the package's version is not yet published on its platform, and no-ops otherwise. See [Detection](detection.md).
- Release jobs always run, in dependency order, following a root `release.yml` dependency tree. See [Packages](packages.md) and [CI Flow](ci-flow.md).
- A cascade-bump test, on PRs and `X.Y.Z` tags, requires every dependent of a bumped package to be bumped too. See [Detection](detection.md#cascade-bump-test).

## Objectives

- **A single release trigger**: one tag family (`X.Y.Z`) instead of four.
- **Per-package releases**: each package releases only when its version is new, so one tag can release any subset of packages.
- **Enforced cascade bumps**: a dependency bump can never ship without its dependents being bumped (and so released) too.
