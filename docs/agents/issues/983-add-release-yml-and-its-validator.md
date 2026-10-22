# Issue: Add `release.yml` and its validator

## Description

Part of Epic #977 (release-cycle overhaul). Add a root `release.yml` describing the release dependency tree, and a Node validator with jasmine specs that keeps it in sync with each `package.json`. The validator runs in CI.

## Problem

Several upcoming release scripts need to know the same things about each package: where it lives, its platform, what it depends on, and its extra tag. Those scripts are the cascade-bump test (#984), the per-package release jobs (#986, #987) and the tag-push job (#988). Without one shared source, each script would hardcode the tree and they would drift apart.

## Expected Behavior

### `release.yml`

A root `release.yml` lists every release:

| Key | Folder | Platform | Depends on | Tag prefix |
|---|---|---|---|---|
| `deku-sprout` | `logger` | npm | - | `sprout-` |
| `deku-swarm` | `worker` | npm | - | `swarm-` |
| `navi-hey` | `source` | npm | `deku-sprout`, `deku-swarm` | - |
| `darthjee/navi-hey` | `source` | docker | `navi-hey` | - |
| `navi-hey-client` | `clients/node` | npm | `deku-sprout` | `node_client-` |
| `darthjee/navi-hey-client` | `clients/node` | docker | `navi-hey-client` | - |

- Start from the illustrative format in `docs/agents/specs/release/packages.md#dependency-tree-releaseyml`. This issue settles the exact keys.
- A Docker entry's version is the `version` of the `package.json` in its folder.

### Validator

The validator fails, naming every problem, when any of these checks fails:

1. **Folder and name.** Each entry's `folder` exists and holds a `package.json`. For an npm entry, the key equals that `package.json`'s `name`.
2. **npm `depends_on` matches `package.json`.**
   - Every package an npm entry lists must be declared in its `package.json` `dependencies` or `peerDependencies`.
   - Every `release.yml` package declared there must be listed in `depends_on`.
   - A dependency counts as local when its name is a `release.yml` key. The specifier does not matter: `navi-hey-client` declares `deku-sprout` as `^0.3.0`, not `file:`.
   - `devDependencies` are ignored, so `navi-spec-support` stays out of the tree.
3. **Docker entries.** A docker entry depends on exactly the npm package that lives in the same folder.

It exits 0 and prints a short OK line when everything matches.

### CI

- A new CI job runs the validator, using the same tag filters as the other test jobs today. Sub-issue #985 later restricts tags to `X.Y.Z`.
- The validator runs on PR branches and on `X.Y.Z` tags.

## Solution

- Write the validator as a Node script that parses `release.yml` with the `yaml` package (already used by `source/` and `clients/node/`).
- Put the logic in a small module that can be tested, separate from a thin CLI entrypoint. The jasmine specs run on fixture trees and cover:
  - the happy path;
  - a dependency missing from `depends_on`;
  - an extra `depends_on` entry;
  - a bad folder or a name mismatch;
  - a wrong docker dependency.
- Proposed location: `scripts/release/`, with its own `package.json` holding `yaml` and `jasmine`, plus `lib/` and `spec/`. Expose it as a `scripts/ci.sh` action (e.g. `validate-release-yml`). The plan may pick another location, as long as the script and its specs live together.
- Add the CI job to `.circleci/config.yml` with the `darthjee/circleci_node` image.
- Out of scope:
  - checking that every `depends_on` target exists, and checking for cycles;
  - the cascade-bump test (#984);
  - any change to the release jobs.

## Ownership

architect (`scripts/`, root `release.yml`, `.circleci/config.yml`).

## Dependencies

None. #984 (cascade-bump test), #986 (npm release jobs), #987 (Docker release jobs) and #988 (tag-push job) read this file.
