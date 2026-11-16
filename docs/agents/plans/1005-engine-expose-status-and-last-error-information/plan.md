# Plan: Engine: expose status and last error information

Issue: [1005-engine-expose-status-and-last-error-information.md](../../issues/1005-engine-expose-status-and-last-error-information.md)

## Overview

Add an observable, serializable status to the deku-swarm `Engine`: a `status` getter, a `snapshot()` method and a `'crash'` event, recording the last loop error. The deku-swarm agent implements, tests and version-bumps it; the docs agent documents it in the deku-swarm guides. Adopting it in navi's `source/` is out of scope (follow-up).

## Agents involved

- [deku-swarm](deku-swarm.md)
- [docs](docs.md)

## Shared contracts

- `engine.status` (getter) → one of `'idle'`, `'running'`, `'paused'`, `'draining'`, `'stopping'`, `'stopped'`, `'crashed'`.
  - `idle`: `start()` never called. While the loop runs, precedence is `stopping` (after `stop()`) > `draining` (during `shutdown()`) > `paused` > `running`. After exit: `crashed` if the last run threw, else `stopped`.
- `engine.snapshot()` → fresh plain object each call: `{ status: string, startedAt: number|null, stoppedAt: number|null, lastTickAt: number|null, lastError: { name: string, message: string, at: number } | null }` (timestamps are epoch ms from `Date.now()`; `stoppedAt` is `null` while running or never run).
- Event `'crash'`: emitted via `engine.on('crash', (error) => ...)` with the original `Error` when the loop throws; `start()` still rejects with that same error; a throwing listener never replaces the rejection reason.
- A later `start()` → `running`, refreshes `startedAt`, clears `stoppedAt`; `lastError` is kept until a new crash overwrites it.
