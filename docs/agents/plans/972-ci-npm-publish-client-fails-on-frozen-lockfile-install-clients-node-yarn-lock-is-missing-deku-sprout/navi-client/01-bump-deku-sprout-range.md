# Bump deku-sprout range
Change the `deku-sprout` dependency in `clients/node/package.json` from `^0.1.0` to `^0.3.0`, matching the in-repo `logger/` version. On 0.x versions the caret doesn't allow minor upgrades, so `^0.1.0` pins the client to the stale `0.1.0`. The logger's code is unchanged since 0.1.0, so no client code changes are expected.

## Files to Change
- `clients/node/package.json` — `"deku-sprout": "^0.1.0"` → `"deku-sprout": "^0.3.0"`.
