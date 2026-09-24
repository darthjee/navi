# Issue: Rewrite deku-sprout file: dependency to its published version when releasing navi-hey

## Description
When `navi-hey` is released, the `npm-publish` CircleCI job runs `scripts/ci.sh build-frontend` before `scripts/ci.sh publish source`. `scripts/ci/build-frontend.sh` rewrites the local `deku-swarm` link in `source/package.json` to the published version:

```bash
WORKER_VERSION=$(node -p "require('./worker/package.json').version")
sed -i "s/\"deku-swarm\": \"file:[^\"]*\"/\"deku-swarm\": \"$WORKER_VERSION\"/" source/package.json
```

Since #916, `source/package.json` also depends on `"deku-sprout": "file:../logger"`, but nothing rewrites that entry.

## Problem
- The next `navi-hey` release would be published to npm with a `file:../logger` dependency. Installing it would fail because `../logger` doesn't exist for people who install the package.
- The `deku-swarm` rewrite sits in `build-frontend.sh`, which has nothing to do with dependency pinning, so it's easy to miss when a new local package is added.
- Nothing stops a publish when a `file:` dependency is left behind.

## Expected Behavior
- The published `navi-hey` `package.json` pins both `deku-swarm` and `deku-sprout` to exact versions, taken from `worker/package.json` and `logger/package.json` (for example `"deku-sprout": "0.1.0"`, not `"^0.1.0"`).
- The release fails before publishing if `source/package.json` still contains any `file:` dependency.

## Solution
- Create a new CI script (for example `scripts/ci/pin-local-deps.sh`, registered in `scripts/ci.sh`) that:
  - Rewrites `"deku-swarm": "file:..."` in `source/package.json` to the exact version from `worker/package.json`.
  - Rewrites `"deku-sprout": "file:..."` in `source/package.json` to the exact version from `logger/package.json`.
  - Afterwards, fails with a clear error if any `file:` dependency is still in `source/package.json`.
- Remove the `deku-swarm` rewrite from `scripts/ci/build-frontend.sh`, so that script only builds the frontend.
- In `.circleci/config.yml`, add a step to the `npm-publish` job that runs the new script after "Build frontend" and before "Publish to npm".
- No extra job ordering is needed. `npm-publish` already requires `check-and-publish-worker` and `check-and-publish-deku-sprout`. When those skip publishing, the version in the package's `package.json` is expected to already be on npm.

### Out of scope
- `deku-swarm` (`worker/`) has no runtime dependencies. It receives a logger through `loggerFactory` injection, so no rewrite is needed there.
- `navi-hey-client` (`clients/node/`) already depends on `"deku-sprout": "^0.1.0"`.

## Benefits
- `navi-hey` releases stay installable from npm now that it depends on `deku-sprout`.
- Dependency pinning lives in one dedicated place instead of being hidden in the frontend build.
- The `file:` guard catches a local package that gets added later without being pinned.
