# Port the Logger stack

Create a self-contained `Logger`/`BaseLogger`/`ConsoleLogger` trio under `clients/node/lib/logging/`, ported from `source/lib/common/utils/logging/{Logger,BaseLogger,ConsoleLogger}.js`. This is a straight port — same five-level threshold logic, same `LOG_LEVEL` env var default, same static-facade shape — with `LoggerGroup` deliberately **not** ported (the client CLI only ever has one output sink; fan-out has no use case here), so `Logger`'s singleton wraps a single `ConsoleLogger` directly instead of a `LoggerGroup([...])`.

Keep the per-class JSDoc style and public-before-private method ordering used elsewhere in `clients/node/lib/`.

## Files to Change

- `clients/node/lib/logging/BaseLogger.js` — new. Level-filtering logic ported from `source/lib/common/utils/logging/BaseLogger.js` verbatim (`debug`/`info`/`warn`/`error`/`silent`, `LOG_LEVEL` env var default, `setLevel`/`suppress`).
- `clients/node/lib/logging/ConsoleLogger.js` — new. `_output` ported verbatim from the engine's `ConsoleLogger.js` (routes to `console[level](message, attributes)`).
- `clients/node/lib/logging/Logger.js` — new. Static facade (`Logger.debug/info/warn/error`, `Logger.setLevel`, `Logger.reset`) ported from the engine's `Logger.js`, minus every `LoggerGroup`-related method (`setLogger`, `addLogger`) — the singleton is a single `ConsoleLogger` instance, not a group.
