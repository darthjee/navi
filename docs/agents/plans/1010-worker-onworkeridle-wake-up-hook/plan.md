# Plan: Worker: onWorkerIdle wake-up hook

Issue: [1010-worker-onworkeridle-wake-up-hook.md](../../issues/1010-worker-onworkeridle-wake-up-hook.md)

## Overview

Let a `deku-swarm` host wake the `Engine` loop as soon as a worker finishes a job, instead of waiting up to `sleepMs` for the next tick. `Worker` gets an optional, payload-less `onWorkerIdle` hook (forwarded by `WorkerFactory`, called after `setIdle`), and `Engine` gets a public `wake()` that interrupts the current sleep, latches mid-tick wakes, and is a no-op when the loop is not running. The host wires the two through a late-bound closure. Nothing is auto-subscribed. Navi `source/` adoption is out of scope (#1017).

## Agents involved

- [deku-swarm](deku-swarm.md)
- [docs](docs.md)

## Shared contracts

- `new Worker({ id, jobRegistry, workersRegistry, loggerFactory, onWorkerIdle })`: `onWorkerIdle` is an optional `() => void` and defaults to a no-op.
- `Worker#perform()`'s `finally` runs `this.job = undefined`, then `workersRegistry.setIdle(this.id)`, then `onWorkerIdle()` with no arguments. This happens on both the success and the failure path.
  - If the hook throws, the error is caught and logged once at `warn` through the job's `logContext`.
  - `perform()` still resolves normally and `setIdle` has already run.
- `new WorkerFactory({ ..., onWorkerIdle })`: every built `Worker` receives it. When omitted, workers get the no-op default.
- `WorkersRegistryInstance` is unchanged and gains no `onWorkerIdle` option.
- `Engine#wake()`: public, returns `undefined`, never throws, never starts the loop.
  - **Sleeping loop:** resolves the pending sleep immediately, so the next tick runs right away in every mode (running, paused, draining).
  - **Mid-tick (running but not sleeping):** sets a pending latch, so the next `#sleep()` returns immediately once and clears the latch.
  - **Not running** (before `start()` or after the loop exited): no effect.
  - `start()` clears any pending latch when it begins. With `sleepMs < 0`, sleeps are already skipped, so `wake()` has no observable effect.
- Host wiring example (for docs): `let engine; new WorkerFactory({ ..., onWorkerIdle: () => engine?.wake() }); ...; engine = new Engine({...})`.
- Versions: `deku-swarm` 1.15.0 → 1.16.0; app (`source/`) 1.14.4 → 1.14.5.
