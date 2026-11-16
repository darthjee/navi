# Deku-swarm Plan: Engine: expose status and last error information

Main plan: [plan.md](plan.md)

## Shared contracts

Produces:

- `engine.status` (getter) → one of `'idle'`, `'running'`, `'paused'`, `'draining'`, `'stopping'`, `'stopped'`, `'crashed'`.
  - `idle`: `start()` never called. While the loop runs, precedence is `stopping` (after `stop()`) > `draining` (during `shutdown()`) > `paused` > `running`. After exit: `crashed` if the last run threw, else `stopped`.
- `engine.snapshot()` → fresh plain object each call: `{ status: string, startedAt: number|null, stoppedAt: number|null, lastTickAt: number|null, lastError: { name: string, message: string, at: number } | null }` (timestamps are epoch ms from `Date.now()`; `stoppedAt` is `null` while running or never run).
- Event `'crash'`: emitted via `engine.on('crash', (error) => ...)` with the original `Error` when the loop throws; `start()` still rejects with that same error; a throwing listener never replaces the rejection reason.
- A later `start()` → `running`, refreshes `startedAt`, clears `stoppedAt`; `lastError` is kept until a new crash overwrites it.

## Steps

- [01 — Track status, timestamps and last error](deku-swarm/01-track-status-and-errors.md)
- [02 — Status specs](deku-swarm/02-status-specs.md)
- [03 — Bump versions](deku-swarm/03-bump-versions.md)

## CI Checks

- `deku-swarm`: `npm test` (CI job: `jasmine-deku-swarm`)
- `deku-swarm`: `npm run lint` and `npm run report` (jscpd) (CI job: `checks-deku-swarm`)
- root: `scripts/ci.sh cascade-bump-check` (CI job: `cascade-bump-check`)

## Notes

- Worker already catches job errors in `Worker.perform()`; a crash only comes from the loop body (registry/allocator calls, synchronous `onIdleTimeout` throw).
- Keep the existing `finally` drain-settling from #1009 intact; add `#stoppedAt` there.
- Do not use the event name `'error'` — Node's EventEmitter throws on an unhandled `'error'`.
- `stopping` is only observable between `stop()` and the loop exit; with `sleepMs: -1` that window is microtask-short, so specs should use a small positive `sleepMs` or check status synchronously right after `stop()`.
