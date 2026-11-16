# Issue: Docs: fold the engine-shutdown spec into permanent docs and remove it

## Description
Epic #1004 delivered `Engine.shutdown({ timeoutMs })` (#1009), engine status/last-error (#1005), `JobRegistry.prune` (#1006) and the `onWorkerIdle` / `wake()` hook (#1010) in `deku-swarm`, designed in the temporary spec `docs/agents/specs/engine-shutdown.md`. Per `docs/agents/specs.md`, the spec must now be folded into the permanent docs and removed.

## Problem
The implementation PRs already documented `wake()`, `onWorkerIdle`, `status` / `snapshot()` and `prune()` in `docs/guides/deku-swarm/*`, but:
- `shutdown()` itself is not documented in any permanent doc. It only appears in passing (the `draining` status, `wake()` speeding up a drain).
- The `Engine` section of `deku-swarm/README.md` lists only `start` / `stop` / `pause` / `resume`.
- The `Engine` loop description in `docs/agents/deku-swarm.md` is stale: it has no draining branch, `wake()` or idle hook.
- The `keepAlive` example in `docs/guides/deku-swarm/running-the-engine.md` still handles `SIGTERM` with a bare `stop()`.

## Expected Behavior
- The permanent docs describe what actually shipped, including the caveats:
  - after a timed-out drain (`shutdown()` returned `false`), `start()` still resolves with work in flight, so "loop ended" does not mean "all jobs finished";
  - retry promotion is frozen during the drain: jobs in `failed` whose cooldown elapses stay there until a later run (intended, not a lost-retry bug);
  - pending jobs (`enqueued`, `retryQueue`, `failed`) are untouched, and running `perform()` calls are never cancelled;
  - the pinned edge cases (before `start()`, after exit, repeated calls, `timeoutMs` omitted or `0`, `stop()` during a drain).
- `docs/agents/specs/engine-shutdown.md` and `docs/agents/specs/engine-shutdown/` are gone, and their row is removed from `docs/agents/specs.md`. The Crawler row remains, so the table stays.

## Solution
- `docs/guides/deku-swarm/running-the-engine.md`: add `shutdown({ timeoutMs })` to the "Controlling the loop" table and a "Graceful shutdown" section covering the semantics, guarantees, caveats and edge cases. Change the `keepAlive` / `SIGTERM` example to `await engine.shutdown({ timeoutMs })`, and mention `stop()` as the immediate, non-draining alternative.
- `docs/guides/deku-swarm/reference.md`: add a `shutdown({ timeoutMs })` row to the `Engine` method table.
- `deku-swarm/README.md`: bring the `Engine` method table up to date with everything that shipped (`shutdown`, `wake`, `status`, `snapshot`, `on` / `crash` event), linking to the guide for details.
- `docs/agents/deku-swarm.md`: update the `Engine` loop description (the `#draining` branch in `#shouldContinue()`, frozen promotion / allocation / idle tracking during drain, `wake()`, `onWorkerIdle` wiring). Add the design decisions (Engine-only, boolean return value, `keepAlive` immutable, no cancellation) and the out-of-scope notes (flush mode, drain events, Navi adoption, cooperative cancellation).
- Delete the spec hub and its subfolder, and remove the row from `docs/agents/specs.md`.
- Docs only: no code change and no version bump.

Responsible agents: docs (README, guides), architect (`docs/agents/*`, spec removal).

## Benefits
- Consumers (for example darthjee/kerghan#479) can rely on `shutdown()` from the published docs instead of a temporary spec.
- The caveats are documented, so a timed-out drain or a stuck cooling job is not mistaken for a bug.
