# Dev Plan: Rename logger/ folder to deku-sprout/

Main plan: [plan.md](plan.md)

## Shared contracts

- Relies on `deku-sprout/` existing (logger step). Inside Docker it is mounted at `/home/node/deku-sprout` (docker step). On a bare CI checkout it is copied to `dev/deku-sprout` (coordinator's `scripts/ci/setup-dev.sh` change).
- Produces the link `"deku-sprout": "file:../deku-sprout"`.

## Implementation Steps

### Step 1: Update the package link and regenerate the lockfile

In `dev/app/package.json:18`, change `"deku-sprout": "file:../logger"` → `"deku-sprout": "file:../deku-sprout"`. Regenerate `dev/app/yarn.lock` with `yarn install` in the `navi_dev_app` container. Don't edit it by hand. The entry `"deku-sprout@file:../logger"` (line 761) should become `"deku-sprout@file:../deku-sprout"`.

## Files to Change

- `dev/app/package.json`: the `deku-sprout` `file:` link
- `dev/app/yarn.lock`: regenerated

## CI Checks

- `dev/app`: CI jobs `jasmine-dev`, `checks-dev` (bootstrapped by `scripts/ci/setup-dev.sh`)
