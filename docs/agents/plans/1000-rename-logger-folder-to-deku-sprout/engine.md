# Engine Plan: Rename logger/ folder to deku-sprout/

Main plan: [plan.md](plan.md)

## Shared contracts

- Relies on `deku-sprout/` existing (logger step).
- Produces the link `"deku-sprout": "file:../deku-sprout"`. The coordinator's `scripts/ci/pin-local-deps.sh` rewrites exactly this value at release time.

## Implementation Steps

### Step 1: Update the package link and regenerate the lockfile

In `source/package.json:37`, change `"deku-sprout": "file:../logger"` → `"deku-sprout": "file:../deku-sprout"`. Leave `"deku-swarm": "file:../worker"` alone (#1001). Regenerate `source/yarn.lock` by running `yarn install` in the container, where `/home/node/deku-sprout` is mounted. Don't edit the lock by hand. The entry `"deku-sprout@file:../logger"` (line 979) should become `"deku-sprout@file:../deku-sprout"`. If `source/package-lock.json` has a `deku-sprout` entry pointing at `../logger`, regenerate or update it the same way.

## Files to Change

- `source/package.json`: the `deku-sprout` `file:` link
- `source/yarn.lock`: regenerated
- `source/package-lock.json`: only if it references `../logger`

## CI Checks

- `source/`: `yarn test`, `yarn lint` (CI jobs `jasmine`, `checks`)

## Notes

- `source/lib/` imports `from 'deku-sprout'` (the package name), so no source code changes. Don't touch `Logger` / logging class names.
