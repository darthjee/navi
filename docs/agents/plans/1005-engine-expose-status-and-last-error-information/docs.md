# Docs Plan: Engine: expose status and last error information

Main plan: [plan.md](plan.md)

## Shared contracts

Relies on (produced by deku-swarm):

- `engine.status` (getter) → one of `'idle'`, `'running'`, `'paused'`, `'draining'`, `'stopping'`, `'stopped'`, `'crashed'`.
  - `idle`: `start()` never called. While the loop runs, precedence is `stopping` (after `stop()`) > `draining` (during `shutdown()`) > `paused` > `running`. After exit: `crashed` if the last run threw, else `stopped`.
- `engine.snapshot()` → fresh plain object each call: `{ status: string, startedAt: number|null, stoppedAt: number|null, lastTickAt: number|null, lastError: { name: string, message: string, at: number } | null }` (timestamps are epoch ms from `Date.now()`; `stoppedAt` is `null` while running or never run).
- Event `'crash'`: emitted via `engine.on('crash', (error) => ...)` with the original `Error` when the loop throws; `start()` still rejects with that same error; a throwing listener never replaces the rejection reason.
- A later `start()` → `running`, refreshes `startedAt`, clears `stoppedAt`; `lastError` is kept until a new crash overwrites it.

## Implementation Steps

### Step 1 — Document status and snapshot in the running guide
In `docs/guides/deku-swarm/running-the-engine.md`, add a section "Observing engine status": the status values and when each applies, a `snapshot()` example (e.g. serving it from a health endpoint), the `'crash'` event with `engine.on('crash', err => ...)`, the fact that `start()` still rejects, and that `lastError` survives a restart.

### Step 2 — Reference entries
In `docs/guides/deku-swarm/reference.md`, add `status`, `snapshot()` (with the object shape) and the `'crash'` event to the Engine API reference.

## Files to Change
- `docs/guides/deku-swarm/running-the-engine.md` — new status/crash section.
- `docs/guides/deku-swarm/reference.md` — API entries.

## Notes
- Match the existing style of the shutdown docs added for #1009/#1011.
