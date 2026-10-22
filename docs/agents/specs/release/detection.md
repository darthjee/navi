# Detection

[Back to the release spec](../release.md)

## Per-package release detection

On an `X.Y.Z` tag, a package releases when the `version` in its folder's `package.json` is not yet published on its platform:

- **npm**: `npm view <package>@<version> version` returns nothing or a 404. This is the check `scripts/ci/check-and-publish-package.sh` already does for `deku-swarm` and `deku-sprout`; it is generalized to every npm package.
- **Docker Hub**: the image tag `<image>:<version>` does not exist yet.

Otherwise the package's job runs and no-ops. Detection is by published version, not by diffing files since the previous release: whether files changed without a bump is the concern of the existing forgotten-bump check (`scripts/lib/package_bump_check.sh`), not of detection.

## Cascade-bump test

A new CI test runs on PR branches and on `X.Y.Z` tags. When the branch changes a package's version, every package that depends on it, directly or transitively per [`release.yml`](packages.md#dependency-tree-releaseyml), must change its version too. Otherwise the test fails, naming the missing bumps.

Examples:

- A `deku-sprout` bump requires bumps of `navi-hey` and `navi-hey-client` (and so their images).
- A `deku-swarm` bump requires a `navi-hey` bump.
- A `navi-hey-client` bump requires nothing more (its image follows its version).

The comparison base depends on the CI context:

- `X.Y.Z` tags: the previous `X.Y.Z` tag reachable from `HEAD^`;
- `main`: `HEAD^` (the merged commit's parent);
- PR branches: `git merge-base HEAD origin/main`;
- when no base can be found (e.g. no previous `X.Y.Z` tag), the test passes with a message.

A package with no `package.json` at the base ref counts as not bumped. Docker entries are not checked on their own, since they follow their folder's `package.json` version.

Implemented in `scripts/release/` (`checkCascadeBumps`) and run by `scripts/ci.sh cascade-bump-check` (CI job `cascade-bump-check`).

Related precedent: `scripts/lib/package_bump_check.sh`, shared by `scripts/ci/check-and-publish-package.sh` and `scripts/bump_version.sh`, already compares a package's version against its last release tag.
