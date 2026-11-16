# docs Plan: Worker: onWorkerIdle wake-up hook

Main plan: [plan.md](plan.md)

## Shared contracts

Documents the contracts in [plan.md](plan.md#shared-contracts) exactly as specified:
- the `onWorkerIdle` attribute on `Worker` and `WorkerFactory` (no payload, called after `setIdle`, isolated errors);
- `Engine#wake()` (ends the current sleep in any mode, latches mid-tick wakes, no-op when not running);
- the late-bound host wiring example.

## Implementation Steps

### Step 1 — Running the Engine guide
In `docs/guides/deku-swarm/running-the-engine.md`:
- add `wake()` to the "Controlling the loop" table;
- add a short "Waking the loop early" section that:
  - explains that a tick normally waits `sleepMs`;
  - shows the closure wiring `onWorkerIdle: () => engine?.wake()` on the host's `WorkerFactory`;
  - notes that it speeds up both allocation and a `shutdown()` drain;
  - says that without wiring the engine keeps plain polling.

### Step 2 — Setup and reference
- **`docs/guides/deku-swarm/setup.md`:** add `onWorkerIdle` to the `new WorkerFactory({...})` options table, linking to the new section.
- **`docs/guides/deku-swarm/reference.md`:**
  - add `onWorkerIdle` to the `Worker` constructor row and the `WorkerFactory` row;
  - add a `wake()` row under `Engine`.

## Files to Change
- `docs/guides/deku-swarm/running-the-engine.md`: `wake()` in the controls table, new wiring section.
- `docs/guides/deku-swarm/setup.md`: `onWorkerIdle` factory option.
- `docs/guides/deku-swarm/reference.md`: `Worker`, `WorkerFactory` and `Engine` entries.

## Notes
- Don't document wiring in navi `source/`; that is #1017.
- The broader graceful-shutdown fold-in from the spec belongs to #1011. Only document what #1010 adds.
