# Architect Plan: Docs: fold the engine-shutdown spec into permanent docs and remove it

Main plan: [plan.md](plan.md)

## Shared contracts

- Link to the user guide's `../guides/deku-swarm/running-the-engine.md#graceful-shutdown` section, written by the docs agent.
- Describe the drain exactly as listed in [plan.md's Shared contracts](plan.md#shared-contracts).

## Implementation Steps

### Step 1 — Refresh `docs/agents/deku-swarm.md`
- **`### Engine`**:
  - Rewrite the loop description to match `deku-swarm/lib/services/Engine.js`: when not draining, the loop promotes, allocates (if not paused and ready jobs exist) and checks the idle timeout; it then sleeps through the wakeable `#sleep()`.
  - Document `#shouldContinue()`'s `#draining` branch (`hasBusyWorker() && !#drainTimedOut`, with the timeout checked per tick) next to the existing `keepAlive || #continueAllocating()` rule.
  - Document `shutdown({ timeoutMs })`: the `#drainPromise` reuse, the immediate resolution when not running, stopped or `timeoutMs <= 0`, and the `finally` block that resolves the pending drain with `!hasBusyWorker()` (including on a crash).
  - Mention `wake()`, `status` / `snapshot()` and `on` / `'crash'` briefly, if they are not covered yet.
  - State the caveats: `start()` resolves with work in flight after a timed-out drain, and promotion is frozen.
- **`### Worker` / `### WorkerFactory`**: mention the optional `onWorkerIdle` hook (called after `setIdle`, and a throw is logged at `warn`) and that the factory passes it to every worker, if not already covered.
- **New subsection "Graceful shutdown: design decisions"** under `## Engine and allocation`, carrying over the spec's table:
  - Engine-only, with no `WorkersRegistry.whenIdle()`;
  - a boolean return value;
  - `keepAlive` stays immutable;
  - an explicit `#draining` branch;
  - `start()` resolves on timeout;
  - promotion is frozen with allocation;
  - no cancellation.
- **`## Out of scope`**: add the spec's deferred items:
  - flush mode (a possible future `shutdown({ flush: true })`);
  - `drain` / `drained` events (hosts emit around `await shutdown()`);
  - switching Navi's `EngineController` to `shutdown()` (belongs to consumers or a separate issue);
  - cooperative cancellation of `Job.perform()` (would need a signature change).
- Link to the user guide's `#graceful-shutdown` section instead of duplicating the edge-case table.

### Step 2 — Remove the spec
- Delete `docs/agents/specs/engine-shutdown.md` and the whole `docs/agents/specs/engine-shutdown/` folder (8 files).
- Remove the `Engine Graceful Shutdown` row from the table in `docs/agents/specs.md`. The `Crawler` row remains, so keep the table; do **not** replace it with `_No specs at the moment._`.
- Run `grep -rn "engine-shutdown" --exclude-dir=node_modules .` and confirm that only historical `docs/agents/issues/` and `docs/agents/plans/` files still mention it.

## Files to Change
- `docs/agents/deku-swarm.md` — the Engine loop and drain, the Worker / WorkerFactory hook, design decisions and out-of-scope notes.
- `docs/agents/specs.md` — remove the spec row.
- `docs/agents/specs/engine-shutdown.md` — delete.
- `docs/agents/specs/engine-shutdown/*` — delete (`edge-cases.md`, `idle-hook.md`, `loop-exit.md`, `open-questions.md`, `out-of-scope.md`, `semantics.md`, `testing.md`, `versioning.md`).

## Notes
- Run Step 2 after Step 1, so the design rationale is carried over before the spec is deleted.
- The spec's `versioning.md` (1.12.0 → 1.13.0) and `testing.md` are historical; the package is already at 1.16.0 and the tests exist. Do not carry them over.
