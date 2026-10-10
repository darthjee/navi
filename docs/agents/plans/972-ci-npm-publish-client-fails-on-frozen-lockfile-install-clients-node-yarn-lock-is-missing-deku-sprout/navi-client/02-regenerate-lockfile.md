# Regenerate the lockfile
Run `yarn install` in `clients/node/` (yarn v1, the same as CI's `yarn v1.22.22`) so `clients/node/yarn.lock` gains a `deku-sprout@^0.3.0` entry that resolves to `0.3.x`. Verify that `yarn install --frozen-lockfile` then succeeds from a clean `node_modules`, and that `npm run coverage` and `npm run lint` pass. Only the `deku-sprout` entry should be added; don't upgrade unrelated packages.

## Files to Change
- `clients/node/yarn.lock` — add the `deku-sprout@^0.3.0` entry.
