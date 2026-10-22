# Issue: Write the release-cycle spec in docs/agents/specs/release.md and release/*.md

## Description

Write the spec for the release-cycle overhaul (epic #977). It is a hub, `docs/agents/specs/release.md`, split into topic files under `docs/agents/specs/release/*.md`, following the same pattern as `docs/agents/specs/crawler.md` and `docs/agents/specs/crawler/`. The spec is listed in the `docs/agents/specs.md` hub (#978).

This is docs only: no CI or script changes. The spec is the input for the implementation sub-issues of #977.

## Problem

Releases are driven today by several tag families in `.circleci/config.yml`, each with its own mechanics:

- `X.Y.Z` (e.g. `1.14.1`), whose version must match `source/package.json` (`scripts/check_tag_version.sh`):
  - `check-version-tag`, then `check-and-publish-worker` and `check-and-publish-deku-sprout`.
  - Then `npm-publish` (`navi-hey`), then `build-and-release` (`darthjee/navi-hey`).
  - Then `update-description`, the demo deploys and `navi-hey-test`.
- `client-X.Y.Z`: `check-client-version-tag`, then `npm-publish-client` (`navi-hey-client`), then `build-and-release-client` (`darthjee/navi-hey-client`), then `update-description-client`.
- `worker-X.Y.Z` / `deku-sprout-X.Y.Z`: pushed by CI (`scripts/ci/check-and-publish-package.sh`) and excluded from the test jobs.
- Every other tag (including `client-…`) still runs the full test suite.

The client releases on its own tag. The worker and logger are only published when their version is missing from npm.

## Expected Behavior

- `docs/agents/specs/release.md` exists as a hub and links topic files under `docs/agents/specs/release/`.
- The topic files cover:
  - an overview;
  - tag rules;
  - the package/release table;
  - per-package release detection;
  - the dependency tree file (`release.yml`);
  - the cascade-bump test;
  - the CI job graph;
  - the worked release examples;
  - decisions and gaps.
- The topic files end with the list of implementation sub-issues to create under #977.
- `docs/agents/specs.md` gets a row for the release spec.

## Solution

Base the spec on the content of epic #977 ("Tags and jobs", "Release dependency", "Dependency test", "Dependency tree", "Release Examples"), with the corrections and decisions below.

### Decisions

- **Names**: use the real package and image names: `deku-sprout`, `deku-swarm`, `navi-hey`, `darthjee/navi-hey`, `navi-hey-client`, `darthjee/navi-hey-client`. The `hey-navi` in #977 is a typo.
- **Dependencies come from each `package.json`**:
  - `deku-swarm` (`worker/`): no dependencies. The #977 table lists `deku-sprout`, but `worker/package.json` declares none.
  - `navi-hey` (`source/`): depends on `deku-sprout` and `deku-swarm`.
  - `navi-hey-client` (`clients/node/`): depends on `deku-sprout` only, so its job does **not** wait for `deku-swarm`. The 1.15.1 example in #977 is corrected to match.
  - Each Docker image depends on its npm package.
- **Tags**:
  - Only `X.Y.Z` triggers anything, and `X.Y.Z` is still the `navi-hey` version (it must match `source/package.json`). A release that only changes another package still needs a `navi-hey` bump to get a tag.
  - Other tags (`client-…`, `worker-…`, `deku-sprout-…` and the new ones below) trigger nothing, not even tests.
  - PR branches run tests only.
  - Tests still run on the `X.Y.Z` tag and gate every release job.
- **Extra GitHub tags**: CI pushes them in a separate job after a release.
  - The new prefixes are `sprout-<logger version>`, `swarm-<worker version>` and `node_client-<client version>`. The `<logger version>` given for swarm in #977 is a typo.
  - The existing `deku-sprout-`, `worker-` and `client-` tags remain as history only.
- **Release detection**: a package releases when its `package.json` version is not yet published on its platform (npm, or Docker Hub for images), as `scripts/ci/check-and-publish-package.sh` does today. Otherwise its job runs and no-ops.
- **Job graph**:
  - Every release job always runs, in dependency order: it waits for the jobs of its dependencies, whether those released or no-oped.
  - The extra jobs follow their image. `update-description`, the `demo` and `demo-app` deploys and `navi-hey-test` act only when `darthjee/navi-hey` released. `update-description-client` acts only when `darthjee/navi-hey-client` released.
- **Dependency tree**: a root `release.yml` lists each package with its folder, platform, `depends_on` and tag prefix. The release and cascade scripts read it, and its `depends_on` entries are checked against each `package.json`.
- **Cascade-bump test**:
  - It runs on PRs and on `X.Y.Z` tags.
  - When a package version is bumped, every package that depends on it must be bumped too. For example, a `deku-sprout` bump requires bumps of `navi-hey` and `navi-hey-client`.
  - A `deku-swarm` bump requires a `navi-hey` bump.

### Notes

- Owner: architect (`docs/agents/`).
- Requires #978 (the `docs/agents/specs.md` hub) to be merged first.
