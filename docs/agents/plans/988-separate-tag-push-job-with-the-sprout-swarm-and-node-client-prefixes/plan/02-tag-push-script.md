# 02 — Tag-push script

New `scripts/ci/push-release-tag.sh <package>`, exposed as `scripts/ci.sh push-tag <package>`:

1. Fail unless `GITHUB_TOKEN` is set (skip this check with `DRY_RUN=1`).
2. Install `scripts/release` deps (`install-deps.sh scripts/release true`, as `release-npm-package.sh` does) and resolve `FOLDER` and `TAG_PREFIX` through `scripts/lib/release_package_info.sh`.
3. Fail when the package has no `tag_prefix` (e.g. `navi-hey`, the Docker images): it must never be wired to such a package.
4. `TAG=<TAG_PREFIX><version of FOLDER/package.json>`.
5. Skip (exit 0) when the tag exists locally (`git rev-parse`) or on `origin` (`git ls-remote --tags`).
6. `DRY_RUN=1`: print `would push tag $TAG` and stop.
7. Otherwise set a CI git identity, `git tag -a "$TAG" -m "Release $TAG"` on `HEAD`, and push only that tag to `https://x-access-token:${GITHUB_TOKEN}@github.com/darthjee/navi.git`.

Header comment in the style of `release-npm-package.sh` (usage, flow, env: `DRY_RUN`, `GITHUB_TOKEN`, pointer to `docs/agents/release-token.md`).

## Files to Change

- `scripts/ci/push-release-tag.sh` — new.
- `scripts/ci.sh` — add the `push-tag` action.
