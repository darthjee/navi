# Plan: Docs: fold the engine-shutdown spec into permanent docs and remove it

Issue: [1011-docs-fold-the-engine-shutdown-spec-into-permanent-docs-and-remove-it.md](../../issues/1011-docs-fold-the-engine-shutdown-spec-into-permanent-docs-and-remove-it.md)

## Overview
This is a docs-only change: no code change and no version bump. The `docs` agent documents `Engine.shutdown({ timeoutMs })` and its caveats in the `deku-swarm` user guides. It switches the `keepAlive` / `SIGTERM` example to a graceful drain and brings the README `Engine` section up to date with everything that shipped in Epic #1004. The `architect` refreshes the agent-facing `docs/agents/deku-swarm.md` (loop, drain branch, design decisions, out-of-scope notes). It then deletes the temporary spec `docs/agents/specs/engine-shutdown*` and its `specs.md` row.

## Agents involved

- [docs](docs.md)
- [architect](architect.md)

## Shared contracts

**Guide anchor.** `docs/guides/deku-swarm/running-the-engine.md` gains a section titled exactly `## Graceful shutdown` (anchor `#graceful-shutdown`). The README, `reference.md` and `docs/agents/deku-swarm.md` link to it.

**Shipped behaviour.** Verified against `deku-swarm/lib/services/Engine.js`. Both agents must describe it identically:

- `shutdown({ timeoutMs = 0 } = {})` returns `Promise<boolean>`. It resolves `true` when no worker is busy any more and `false` when `timeoutMs` elapsed with work still in flight.
- While draining, the loop keeps ticking but skips `promoteReadyJobs()`, allocation and idle-timeout tracking. `#shouldContinue()` has an explicit `#draining` branch: continue only while `hasBusyWorker()` and the timeout has not elapsed. `keepAlive` is never modified.
- `start()` resolves on both outcomes. After a `false` result it resolves with jobs still running: "loop ended" does not mean "all jobs finished".
- Running `perform()` calls are never cancelled or interrupted.
- Jobs in `enqueued`, `retryQueue` and `failed` are untouched and not lost.
- Retry promotion is frozen: a `failed` job whose cooldown elapses during the drain stays in `failed` until a later run. This is intended, not a lost-retry bug.
- The timeout is checked once per tick, so it can overshoot by up to one `sleepMs`. Wiring `onWorkerIdle: () => engine?.wake()` lets the loop notice a drained pool right away.
- Edge cases:
  - Before `start()`, after the loop exited, or after `stop()`: resolves immediately with `!hasBusyWorker()`. Never throws and never starts the loop.
  - A second call while draining returns the same promise and does not reset the timeout.
  - `timeoutMs` omitted or `0` (or negative): no wait. Resolves immediately with the current pool state, and the loop exits at its next tick.
  - `stop()` during a drain ends the loop at the next tick, and the pending `shutdown()` resolves with `!hasBusyWorker()` at that moment.
  - If the loop crashes during a drain, the pending promise still resolves with `!hasBusyWorker()`.
- `status` is `'draining'` while a drain is in progress. Precedence while running: `stopping` > `draining` > `paused` > `running`.
