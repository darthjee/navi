# Plan: Add deku-sprout version to README and bump navi to 1.12.0 / worker to 1.10.0

Issue: [927-add-deku-sprout-version-to-readme.md](../../issues/927-add-deku-sprout-version-to-readme.md)

## Overview
All version changes are made with the root script `scripts/bump_version.sh`, run three times: deku-sprout 0.1.0, app 1.12.0 and worker 1.10.0. After that, add one hand-written README sentence about the deku-sprout release flow. No specialist owns this: every change comes from a root-level script, apart from one README sentence. The architect does it directly.

## Context
- `scripts/bump_version.sh` supports the `app`, `client`, `worker` and `deku-sprout` targets (the last was added in #922). `bump_deku_sprout()` inserts the `**Deku Sprout Current Version:**` / `**Deku Sprout Next Version:**` lines after `**Worker Next Version:**` when they're missing, and replaces them otherwise, so running it twice is safe.
- Current versions: `source/package.json` 1.11.1, `worker/package.json` 1.9.0, `logger/package.json` 0.1.0 (tag `deku-sprout-0.1.0` exists on origin).
- A previous bump (#830 "Bump version") changed only `README.md`, `source/package.json` and `dockerfiles/demo_navi_hey/Dockerfile`, and didn't touch any lockfiles. This plan follows the same approach.
- The script uses `sed -i ''` (BSD sed), so run it on macOS or adapt it for GNU sed.

## Implementation Steps

### Step 1 — Run the bump script
From the repo root:

```bash
scripts/bump_version.sh deku-sprout 0.1.0
scripts/bump_version.sh app 1.12.0
scripts/bump_version.sh worker 1.10.0
```

Expected results:
- README: the Current Version is `1.12.0` (tag link), the Next Release is `1.12.1` (compare `1.12.0...main`), the Worker Current Version is `1.10.0` (tag `worker-1.10.0`) and the Worker Next Version is `1.10.1`. The new deku-sprout lines, `0.1.0` (tag `deku-sprout-0.1.0`) and `0.1.1` (compare `deku-sprout-0.1.0...main`), appear right after the Worker Next Version line, each separated by a blank line.
- `source/package.json`: `"version": "1.12.0"`.
- `dockerfiles/demo_navi_hey/Dockerfile`: `FROM darthjee/navi-hey:1.12.0`.
- `worker/package.json`: `"version": "1.10.0"`.
- `logger/package.json`: no change.

### Step 2 — Add the deku-sprout release note
Add this paragraph right after the existing worker-release paragraph under the version lines in `README.md`:

> `deku-sprout` is released independently: pushing a `deku-sprout-x.y.z` tag (matching `logger/package.json`) publishes it to npm. Use `bump_version.sh deku-sprout [version]` beforehand to bump its version and the badges above.

## Files to Change
- `README.md`: navi and worker version lines bumped, deku-sprout version lines added (by the script), plus the release note (by hand).
- `source/package.json`: version 1.12.0 (by the script).
- `dockerfiles/demo_navi_hey/Dockerfile`: base image tag 1.12.0 (by the script).
- `worker/package.json`: version 1.10.0 (by the script).

## CI Checks
- `source`: `cd source && yarn install --frozen-lockfile` (CI `install-deps` with `frozen: true`, used by `npm-publish`). `source/yarn.lock` records `deku-swarm@file:../worker` at `version "1.9.0"`, so check that the frozen install still passes after the worker bump.
- Release-time tag checks, which only run on tags but are worth checking locally: `scripts/check_tag_version.sh` reads `source/package.json` and the README `**Current Version:**`, and both must say `1.12.0`.

## Notes
- Lockfiles (`source/yarn.lock`, `source/package-lock.json`) keep the old `1.11.1` / `1.9.0` versions for the local packages, the same as in earlier bumps. Only regenerate them if the frozen install in the CI check above fails.
- Don't tag anything as part of this issue. Releases are cut separately.
