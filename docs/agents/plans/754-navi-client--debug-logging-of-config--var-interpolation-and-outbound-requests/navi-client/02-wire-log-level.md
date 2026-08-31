# Wire LOG_LEVEL / --log-level

Add the `--log-level <level>` CLI flag and make it take precedence over the `LOG_LEVEL` env var (which `BaseLogger`'s constructor already reads as its default) by explicitly calling `Logger.setLevel(level)` when the flag is present, before dispatching the CLI action.

## Files to Change

- `clients/node/lib/CliArgumentsParser.js` — add `'log-level': { type: 'string' }` to `ARGUMENTS_CONFIG.options`; return it as `logLevel` from `parse()`.
- `clients/node/lib/CliRunner.js` — in `run()`, before dispatching, if `logLevel` is present call `Logger.setLevel(logLevel)`; validate it's one of the five known levels (reuse `CliRunner.#validate`'s pattern — an invalid value is a validation error, same shape as the existing `--action` check).
- `clients/node/README.md` and `clients/node/bin/navi-client.js`'s own `--help`-equivalent text, if any exists — confirm whether CLI help text is generated from `CliArgumentsParser` or hand-written elsewhere; only touch it if hand-written (the `docs` agent's plan already covers `README.md` itself).
