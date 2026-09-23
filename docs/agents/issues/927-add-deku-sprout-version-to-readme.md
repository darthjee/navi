# Issue: Add deku-sprout version to README and bump navi to 1.12.0 / worker to 1.10.0

## Description
deku-sprout (the `logger/` package) was extracted in #921–#925 and released as `deku-sprout-0.1.0`. The root `README.md` lists Current/Next versions for navi, the client and the worker, but not for deku-sprout. This issue adds the deku-sprout version lines and also bumps navi to **1.12.0** and the worker to **1.10.0**.

## Problem
- `scripts/bump_version.sh` already has a `deku-sprout` target (added in #922). `bump_deku_sprout()` updates `logger/package.json` and writes the `**Deku Sprout Current Version:**` / `**Deku Sprout Next Version:**` README lines, inserting them after `**Worker Next Version:**` when they're missing. Nobody ran it after the 0.1.0 release, so the README never got the lines.
- The README doesn't say that deku-sprout is released on its own `deku-sprout-x.y.z` tag (#923).
- navi (`source/package.json` at 1.11.1) and the worker (`worker/package.json` at 1.9.0) need a minor version bump for the next release.

## Expected Behavior
- `README.md` shows:
  - `**Deku Sprout Current Version:** [0.1.0](https://github.com/darthjee/navi/releases/tag/deku-sprout-0.1.0)`
  - `**Deku Sprout Next Version:** [0.1.1](https://github.com/darthjee/navi/compare/deku-sprout-0.1.0...main)`
- A short note next to the worker release note explains that deku-sprout is released on its own `deku-sprout-x.y.z` tag, and that `bump_version.sh deku-sprout [version]` bumps it.
- navi is at **1.12.0**: `source/package.json`, the `FROM darthjee/navi-hey:` line in `dockerfiles/demo_navi_hey/Dockerfile`, and the README Current/Next Release lines (1.12.0 / 1.12.1).
- The worker is at **1.10.0**: `worker/package.json` and the README Worker Current/Next Version lines (1.10.0 / 1.10.1).

## Solution
Use `scripts/bump_version.sh` for every change. Don't edit the files by hand.
1. `scripts/bump_version.sh deku-sprout 0.1.0`: inserts the deku-sprout README lines and leaves `logger/package.json` at 0.1.0.
2. `scripts/bump_version.sh app 1.12.0`
3. `scripts/bump_version.sh worker 1.10.0`
4. Add the deku-sprout release note to the README paragraph under the version lines.

`source/package.json` and `dev/app/package.json` depend on deku-swarm/deku-sprout through `file:` paths, and `clients/node` depends on `deku-sprout ^0.1.0`, so no dependency ranges need to change.

## Benefits
- The README shows the current and next versions of all four published packages.
- The next navi and worker releases have their versions prepared through the standard script.
