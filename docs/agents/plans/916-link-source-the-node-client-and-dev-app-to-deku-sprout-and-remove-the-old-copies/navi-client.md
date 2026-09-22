# Navi-Client Plan: Link source, the Node client and dev/app to deku-sprout and remove the old copies

Main plan: [plan.md](plan.md)

## Shared contracts

- `clients/node/package.json` declares a published npm semver range for `deku-sprout` (e.g. `"deku-sprout": "^0.1.0"`), not a local `file:` path — unlike `engine`/`dev`, the client ships standalone and installs from the npm registry, so this requires `deku-sprout` to already be published (sub-issue 5, already merged to `main`).
- Every import of `BaseLogger`/`ConsoleLogger`/`Logger` switches to `import { ... } from 'deku-sprout'`, the package's root entrypoint.

## Implementation Steps

### Step 1 — Add the deku-sprout runtime dependency

Add `"deku-sprout": "^0.1.0"` (match whatever version `check-and-publish-deku-sprout` actually published) to `clients/node/package.json`'s `dependencies`.

### Step 2 — Switch imports to the package and delete the local copies

Update every import of `BaseLogger`, `ConsoleLogger` or `Logger` from `clients/node/lib/logging/` to `import { ... } from 'deku-sprout'` across `clients/node/lib/NaviApiClient.js`, `ConfigFileParser.js`, `EnvStringResolver.js`, `CliRunner.js`, and the corresponding specs (`clients/node/spec/lib/NaviApiClient_spec.js`, `ConfigFileParser_spec.js`, `EnvStringResolver_spec.js`, `CliRunner_spec.js`).

The package's `Logger` is group-aware (adds `setLogger`/`addLogger` on top of the client's current simpler, self-contained port) — check no client spec asserts on the old, simpler behavior before deleting it.

Delete `clients/node/lib/logging/` and `clients/node/spec/lib/logging/` entirely.

## Files to Change

- `clients/node/package.json` — add the `deku-sprout` dependency
- `clients/node/lib/NaviApiClient.js`, `ConfigFileParser.js`, `EnvStringResolver.js`, `CliRunner.js` — import switch
- `clients/node/spec/lib/NaviApiClient_spec.js`, `ConfigFileParser_spec.js`, `EnvStringResolver_spec.js`, `CliRunner_spec.js` — import switch, verify still green against the group-aware `Logger`
- `clients/node/lib/logging/` (`BaseLogger.js`, `ConsoleLogger.js`, `Logger.js`) — delete
- `clients/node/spec/lib/logging/` (`BaseLogger_spec.js`, `ConsoleLogger_spec.js`, `Logger_spec.js`) — delete

## CI Checks

- `clients/node`: `npm run coverage` (job: `jasmine-client`), `scripts/ci.sh lint-and-report clients/node` (job: `checks-client`)

## Notes

- Confirm `deku-sprout`'s actual published version before pinning the semver range — it was scaffolded at `0.1.0` but may have moved by the time this lands.
