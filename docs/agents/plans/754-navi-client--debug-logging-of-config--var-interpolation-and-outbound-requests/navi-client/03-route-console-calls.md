# Route existing console.* calls through Logger

Full inventory (no other call sites exist — confirmed by grepping `clients/node/lib` and `clients/node/bin` for `console.`):

| Call site | Today | Becomes |
| --- | --- | --- |
| `EnvStringResolver.js` — unresolved var | `console.warn` | `Logger.warn` |
| `CliRunner.js:29` — missing/invalid option | `console.error` | `Logger.error` |
| `CliRunner.js:37` — invalid JSON payload | `console.error` | `Logger.error` |
| `CliRunner.js:48` — dispatch/request failure | `console.error` | `Logger.error` |
| `CliRunner.js:45` — successful JSON result | `console.log` | **unchanged** (this is the CLI's actual product output, not a diagnostic — must never be gated by log level) |

`Logger.error`'s default level (`info`) still surfaces these by default (`error` > `info`), so this is behavior-neutral except under `LOG_LEVEL=silent`, which now also suppresses them — matching the engine's own `silent` semantics exactly. The process exit code (`1`) from `CliRunner.run` is unaffected either way.

## Files to Change

- `clients/node/lib/EnvStringResolver.js` — replace the `console.warn` call with `Logger.warn`; import `Logger` from `./logging/Logger.js`.
- `clients/node/lib/CliRunner.js` — replace the three `console.error` calls with `Logger.error`; import `Logger` from `./logging/Logger.js`. Leave the `console.log(JSON.stringify(result, null, 2))` call untouched.
