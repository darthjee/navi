# Issue: CI: npm-publish-client fails on frozen-lockfile install — clients/node/yarn.lock is missing deku-sprout

## Description

The CircleCI job `npm-publish-client` (triggered by `client-X.Y.Z` tags) fails at its **Install dependencies** step, so `navi-hey-client` cannot be published and the downstream `build-and-release-client` / `update-description-client` jobs never run.

```
yarn install v1.22.22
[1/4] Resolving packages...
error Your lockfile needs to be updated, but yarn was run with --frozen-lockfile.
info Visit https://yarnpkg.com/en/docs/cli/install for documentation about this command.

Exited with code exit status 1
```

## Problem

- #924 (commit `bb37eeb`) added `"deku-sprout": "^0.1.0"` to `clients/node/package.json` but did not update `clients/node/yarn.lock` (only `source/yarn.lock` and `dev/app/yarn.lock` were updated). The lockfile currently has no `deku-sprout@` entry.
- `npm-publish-client` is the only client job that installs with `frozen: true` (`scripts/ci/install-deps.sh` → `yarn install --frozen-lockfile`), so it is the first place the stale lockfile surfaces.
- `jasmine-client` and `checks-client` install with `frozen: false`, so they regenerate the lockfile in CI and pass. That's why this wasn't caught on the PR.
- On 0.x versions the caret doesn't allow minor upgrades, so `^0.1.0` only resolves to `deku-sprout@0.1.0`, while the in-repo `logger/` is at `0.3.0`. The client has been tested against `0.1.0` and would ship with it.

### Edge cases

- `client-0.2.3` is the first client tag since #924, so no published `navi-hey-client` version is affected. npm has up to `0.2.2`, and `0.2.3` was never published.
- `deku-sprout@0.3.0` is already on npm, so the new range resolves without waiting on a logger release.

### Backward compatibility

- Low risk: between `deku-sprout` 0.1.0 (`3e3debd`) and 0.3.0 (`d8744ab`) only `logger/README.md` and the version number changed; `logger/lib` is identical. The client only imports `{ Logger }` from `deku-sprout`.
- No change to `navi-hey-client`'s public API or CLI behavior; 0.2.4 is a patch release.

## Expected Behavior

- `cd clients/node && yarn install --frozen-lockfile` succeeds on a clean checkout.
- `clients/node/yarn.lock` resolves `deku-sprout` to `0.3.x`.
- `jasmine-client` and `checks-client` install with a frozen lockfile and pass.
- The `npm-publish-client` job passes on the `client-0.2.4` tag, and `navi-hey-client@0.2.4` is published to npm.

## Solution

1. **Bump the dependency range.** In `clients/node/package.json`, change `"deku-sprout": "^0.1.0"` to `"^0.3.0"` to match the in-repo `logger/` version, and make sure the client specs still pass against it.
2. **Regenerate the lockfile.** Run `yarn install` in `clients/node/` and commit the updated `clients/node/yarn.lock`, which must now contain a `deku-sprout@^0.3.0` entry.
3. **Use a frozen install in the client's PR jobs.** Set `frozen: true` on the `install-deps` step of `jasmine-client` and `checks-client` in `.circleci/config.yml`.
4. **Re-release as 0.2.4.** Leave the existing `client-0.2.3` tag alone. Bump the client to `0.2.4` (package.json + README versions, as checked by `scripts/check_client_tag_version.sh`) so the fix ships under a new `client-0.2.4` tag.

### Out of scope

- Making PR install jobs of the other packages (source, worker, logger, frontend, dev/*) use a frozen install.

## Benefits

- Unblocks the `navi-hey-client` release pipeline.
- The published client uses the current `deku-sprout` instead of a stale 0.1.0.
- A stale client lockfile now fails on the PR instead of at release time.
