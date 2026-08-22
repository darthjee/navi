# engine Plan: Backend: memory monitoring endpoint & config

Main plan: [plan.md](plan.md)

## Overview

Add a `web.memory` config block and a new unauthenticated `GET /memory/status.json` route that
reports the process's RSS against a resolved maximum, with a `status` derived from configured
percentage thresholds.

## Context

- `web.memory.maximum` is optional; when absent it must be resolved via a fallback chain:
  **Config → cgroup v2 limit → cgroup v1 limit → OS total memory**. No byte-size or
  cgroup-reading utility exists anywhere in `source/` today — this is new code, split into one
  small, independently-testable reader class per source, composed behind one orchestrator (per
  the project's dependency-injection convention — see `source/lib/models/configs/WebConfig.js`
  for the existing nested-sub-config pattern to follow for `memory`, and
  `source/lib/server/handlers/StatsHandler.js` / `EngineStatusHandler.js` for the handler shape).
- `status` derivation compares `percentage` against `thresholds.{low,medium,high,over}` using
  **inclusive** (`>=`) boundaries: e.g. `percentage == 50.0` with `medium: 50.0` is already
  `"medium"`. Percentages below `low` still resolve to `"low"` — it's the floor status, there is
  no band beneath it.
- `web.memory.thresholds` must be in strictly ascending order (`low < medium < high < over`).
  Boot **fails fast** on invalid ordering, matching the existing convention for invalid config
  values (e.g. `source/lib/exceptions/config/InvalidParserType.js`).
- Auth: no work needed here — auth in this codebase is opt-in per handler via
  `SecuredRequestHandler` (only used by `/api/*`); `/memory/status.json` simply doesn't extend
  it, the same as `/engine/*`, `/stats.json`, etc.
- `RouteRegister` already handles GET routing + generic error mapping; registering the new route
  is a one-line addition to `GET_ROUTES` in `source/lib/server/Router.js`.

## Steps

- [01 — Add the memory-maximum resolution chain](engine/01-add-memory-maximum-resolution-chain.md)
- [02 — Add the web.memory config model](engine/02-add-web-memory-config-model.md)
- [03 — Add the status handler and route](engine/03-add-memory-status-handler-and-route.md)
- [04 — Document the new route and config](engine/04-document-route-and-config.md)

## CI Checks

- `source`: `yarn test` (CI job: `jasmine`)
- `source`: `yarn lint` (CI job: `checks`)

## Notes

- `os.totalmem()` never throws, so the fallback chain always resolves to *some* maximum — no
  divide-by-zero guard should be needed in the handler, but keep the resolver's contract explicit
  (each reader returns `null` on "no limit here", never throws for that case) so the orchestrator
  logic stays simple.
- Cgroup v2's `memory.max` reports the literal string `"max"` when unbounded; cgroup v1's
  `memory.limit_in_bytes` reports a very large sentinel number (commonly
  `9223372036854771712`) instead — both must be treated as "no limit" by their respective
  readers, not as a real maximum.
- `web.memory` is only ever parsed when `web.port` is set (same gate the whole `web:` block is
  already under in `ConfigParser#webConfig`) — this is expected, not a gap: without a running web
  server there's no route to serve it from anyway.
