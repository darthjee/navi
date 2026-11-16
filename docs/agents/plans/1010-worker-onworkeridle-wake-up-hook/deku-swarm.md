# deku-swarm Plan: Worker: onWorkerIdle wake-up hook

Main plan: [plan.md](plan.md)

## Shared contracts

Implements every contract listed in [plan.md](plan.md#shared-contracts): the `onWorkerIdle` attribute on `Worker` and `WorkerFactory`, the isolated hook call in `perform()`, `Engine#wake()` with its interruptible sleep and latch, and the version bumps.

## Steps

- [01 — onWorkerIdle on Worker and WorkerFactory](deku-swarm/01-worker-hook.md)
- [02 — Engine#wake() and interruptible sleep](deku-swarm/02-engine-wake.md)
- [03 — Specs](deku-swarm/03-specs.md)
- [04 — Bump versions](deku-swarm/04-bump-versions.md)

## CI Checks

- `deku-swarm`: `npm test` and `npm run lint` (plus the jscpd duplication check, `npm run report`) inside `deku-swarm/`.
- root: `scripts/ci.sh cascade-bump-check`. A deku-swarm change requires the app patch bump.

## Notes

- `#1006` already merged and moved the versions to deku-swarm 1.15.0 and app 1.14.4. The issue text's "#1006 also bumps" note is stale; bump from the current values.
- Keep `wake()` free of drain-specific logic. `#shouldContinue()` already re-evaluates `hasBusyWorker()` on every tick, so ending the sleep early is enough for the faster drain.
- Clear the stored sleep resolver/timer when a sleep ends, whether by timeout or by wake, so a later `wake()` cannot resolve a stale promise. When woken, also `clearTimeout` the pending timer so a 10 s `sleepMs` doesn't keep the process alive.
