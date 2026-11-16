# Deku-swarm Plan: Engine: shutdown({ timeoutMs }) drain

Main plan: [plan.md](plan.md)

## Overview
Implement the graceful drain in `deku-swarm/lib/services/Engine.js`, following the spec `docs/agents/specs/engine-shutdown.md` (merged by #1008). One correction from #1009 applies: `stop()` stays the hard exit and is never overridden by a drain.

## Context
- Today `stop()` only sets `#stopped`. `start()`'s loop is `while (!this.#stopped && this.#shouldContinue())`. With `keepAlive: true`, `#shouldContinue()` is always `true`.
- `WorkersAllocator._allocateNext()` runs `perform()` fire-and-forget, so the only idleness signal is `WorkersRegistry.hasBusyWorker()`.
- The timeout is tick-granular, with no dedicated `setTimeout`. The `onWorkerIdle` hook is #1010's job, not this one.

## Steps

- [01 — Add drain state and the shutdown() method](deku-swarm/01-add-shutdown-method.md)
- [02 — Wire the drain into the start() loop](deku-swarm/02-wire-drain-into-loop.md)
- [03 — Jasmine specs for shutdown()](deku-swarm/03-shutdown-specs.md)
- [04 — Correct the engine-shutdown spec](deku-swarm/04-correct-the-spec.md)
- [05 — Bump versions](deku-swarm/05-bump-versions.md)

## CI Checks
- `deku-swarm`: `cd deku-swarm && npm test` (CI job: `jasmine-deku-swarm`)
- `deku-swarm`: `cd deku-swarm && npm run lint && npm run report` (CI job: `checks-deku-swarm`)
- repo: `scripts/ci.sh cascade-bump-check` (CI job: `cascade-bump-check`)

## Notes
- `start()` resolving with `perform()` still in flight (on timeout) is intended. The `false` result signals it.
- With `sleepMs < 0`, the loop only yields microtasks. Drain specs must use worker stubs that settle synchronously, or a small positive `sleepMs`, or the drain can only end by timeout.
- `keepAlive` must stay immutable. Do not clear it in `shutdown()`.
