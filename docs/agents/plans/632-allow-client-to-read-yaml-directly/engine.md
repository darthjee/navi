# Engine Plan: Allow client to read yaml directly

Main plan: [plan.md](plan.md)

## Shared contracts

Guarantees — and proves via a regression test — that `POST /api/config` never resolves env vars on the incoming payload, per `plan.md`'s "Shared contracts". No production code change is expected: `ApiConfigHandler.js` already passes the request body straight through to `NamespaceMap.include` without ever touching `EnvStringResolver` (only `ConfigIncluder`, used exclusively by boot-time file loading, invokes it). This step exists to make that guarantee explicit and protected against regression, not to change behavior.

## Implementation Steps

### Step 1 — Regression test: API never resolves env vars

In `source/spec/lib/server/handlers/api/ApiConfigHandler_spec.js`, add a spec that:
1. Sets a server-side env var (e.g. `process.env.SOME_VAR = 'resolved-value'`, restored in an `afterEach`).
2. Sends a `POST /api/config` request whose `resources` (or `clients`) payload contains a literal `${SOME_VAR}` string in a field value.
3. Asserts the value is stored/retrievable **unresolved** — i.e. the literal string `${SOME_VAR}` is what ends up in the resulting `NamespaceMap`/`Namespace` (via whatever the existing spec file already uses to inspect post-merge state — follow its existing patterns rather than introducing a new inspection mechanism), not `resolved-value`.

If this spec unexpectedly fails, that means the guarantee doesn't currently hold — investigate `ApiConfigHandler.js`'s merge path (`NamespaceMap.include` → ... ) for an unexpected `EnvStringResolver` call and remove it; this is not anticipated based on current code but the plan must account for it.

## Files to Change

- `source/spec/lib/server/handlers/api/ApiConfigHandler_spec.js` — add the env-var-non-resolution regression spec

## CI Checks

- `source`: `npm run coverage` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes

- Purely a test-coverage addition under current understanding of the code (see `source/lib/server/handlers/api/ApiConfigHandler.js` and `source/lib/common/utils/env_resolver/EnvStringResolver.js` — the latter is only ever invoked from `source/lib/services/ConfigIncluder.js`). No production file is expected to change.
