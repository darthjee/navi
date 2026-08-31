# Tests

Mirror `client.js`/`lib/`'s tree under `spec/`, matching this package's existing Jasmine conventions (see e.g. `spec/lib/EnvStringResolver_spec.js`, `spec/lib/NaviApiClient_spec.js`, `spec/lib/CliRunner_spec.js`). Reuse the engine's own logging spec patterns as a reference for level-matrix-style tests (`source/spec/lib/utils/logging/BaseLogger_spec.js`, `Logger_spec.js`, `ConsoleLogger_spec.js`) — same level matrix (`debug`/`info`/`warn`/`error`/`silent`), adapted to the ported (non-`LoggerGroup`) shape.

Cover:

- `BaseLogger`/`ConsoleLogger`/`Logger` — level filtering matrix, `LOG_LEVEL` env var default (save/restore `process.env.LOG_LEVEL` around each test, same pattern as the engine's spec), `setLevel`, `_output` routing to `console[level]`.
- `CliArgumentsParser` — new `--log-level` flag parses into `logLevel`.
- `CliRunner` — `--log-level` (and `LOG_LEVEL` precedence: flag wins when both given) sets the effective level before dispatch; an invalid level value is a validation error; the three migrated `console.error` sites now call `Logger.error` (spy on `Logger.error`, not `console.error`); the successful-result `console.log` path is unchanged (still spy on `console.log` directly).
- `EnvStringResolver` — `matches` array shape (`varName`/`defined`/`length`/`hash`) for set, set-but-empty, and unset vars; hash is stable/deterministic for a given value; existing `Logger.warn`-migrated behavior (step 03) still covered.
- `ConfigFileParser` — dedup behavior for a var referenced multiple times in one file (one `Logger.debug` line per unique var, not per occurrence); per-file summary line counts (placeholder/resolved/missing) stay per-occurrence; multi-file CLI runs (via `CliRunner`) produce one summary + one variable set per file, not combined.
- `NaviApiClient` — `post` calls `Logger.debug` with exactly `{ method, url, body }` before the request; explicitly assert the logged payload/call args never include `headers` or the `Authorization` value (a regression test for the header-exclusion rule, not just an omission-by-absence check).

## Files to Change

- `clients/node/spec/lib/logging/BaseLogger_spec.js` — new.
- `clients/node/spec/lib/logging/ConsoleLogger_spec.js` — new.
- `clients/node/spec/lib/logging/Logger_spec.js` — new.
- `clients/node/spec/lib/CliArgumentsParser_spec.js` — extend for `--log-level`.
- `clients/node/spec/lib/CliRunner_spec.js` — extend for log-level wiring and `Logger.error` routing.
- `clients/node/spec/lib/EnvStringResolver_spec.js` — extend for `matches`/hash behavior.
- `clients/node/spec/lib/ConfigFileParser_spec.js` — extend for dedup + summary logging.
- `clients/node/spec/lib/NaviApiClient_spec.js` — extend for outbound-request debug logging and the header-exclusion regression test.

## CI Checks

- `clients/node`: `yarn coverage` (CI job: `jasmine-client`) — the `c8` coverage thresholds (80% branches/functions/lines/statements) apply to the new `lib/logging/*.js` files too, since `c8.include` in `package.json` covers `lib/**/*.js`.
