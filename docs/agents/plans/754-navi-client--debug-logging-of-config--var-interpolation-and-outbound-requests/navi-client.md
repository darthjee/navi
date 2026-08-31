# navi-client Plan: navi-client: debug logging of config $VAR interpolation and outbound requests

Main plan: [plan.md](plan.md)

## Shared contracts

- Reads the `LOG_LEVEL` env var and a new `--log-level <level>` CLI flag (flag wins), same five levels as the engine (`debug`/`info`/`warn`/`error`/`silent`), default `info`.
- Produces the debug-output shape (deduped per-variable interpolation lines + per-file summary; per-request method/URL/body lines, never headers) that `docs` documents in `clients/node/README.md`.

## Steps

- [01 — Port the Logger stack](navi-client/01-port-logger-stack.md)
- [02 — Wire LOG_LEVEL / --log-level](navi-client/02-wire-log-level.md)
- [03 — Route existing console.* calls through Logger](navi-client/03-route-console-calls.md)
- [04 — Debug-log interpolation](navi-client/04-log-interpolation.md)
- [05 — Debug-log outbound requests](navi-client/05-log-outbound-requests.md)
- [06 — Tests](navi-client/06-tests.md)

## CI Checks

- `clients/node`: `yarn coverage` (CI job: `jasmine-client`)
- `clients/node`: `yarn lint && yarn report` (CI job: `checks-client`)

## Notes

- No dependency on `source/` — every ported class is self-contained under `clients/node/lib/`, same precedent as the existing `EnvStringResolver.js` client-side port.
- Value hashing (interpolation logging) needs a hash function; use Node's built-in `node:crypto` `createHash('sha256')` — no new dependency required, consistent with this package's minimal-dependency stance (only `axios`/`yaml` today).
