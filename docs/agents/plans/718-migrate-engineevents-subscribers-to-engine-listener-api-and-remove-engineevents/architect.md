# Architect Plan: Migrate EngineEvents subscribers to Engine listener API and remove EngineEvents

Main plan: [plan.md](plan.md)

## Shared contracts

Depends on both [worker.md](worker.md) and [engine.md](engine.md) having landed — this step documents the finished state, so it should be done last.

## Implementation Steps

### Step 1 — Correct worker.md's "Engine auxiliary services" table

In `docs/agents/worker.md`'s "Engine auxiliary services (Navi-specific)" table:
- `EngineEvents` row: since the class is deleted, remove its row entirely (or replace with a short note that it was removed and folded into `Engine`'s own listener API, if the table's surrounding prose references it elsewhere — check the "What stays in Navi" list a few lines below too, which currently names `EngineEvents` alongside `EngineStopService`, `FailureChecker`, `RunSummary`).
- `FailureChecker` row: correct the stale path `source/lib/services/FailureChecker.js` → `source/lib/services/execution/FailureChecker.js`, and mark the "Should become an injectable listener" extraction note as done (it's now reached indirectly via `RunReporter`'s `'finish'` subscription).
- `RunSummary` row: mark its "Should become an injectable listener" note as done too, for the same reason (wrapped by `RunReporter`).
- `EngineStopService` row: leave as-is — its cleanup is tracked separately in [#728](https://github.com/darthjee/navi/issues/728), not part of this issue.
- Update the "What stays in Navi" bullet list a few lines below the table to match (remove `EngineEvents` from that list; keep `EngineStopService`, `FailureChecker`, `RunSummary`).

## Files to Change

- `docs/agents/worker.md` — correct the "Engine auxiliary services" table and the "What stays in Navi" list per above.
