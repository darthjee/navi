# Issue: Navi: report pending (enqueued/processing) jobs in the run summary

## Description

The final run summary (`RunSummary`, printed by `RunReporter`) does not show jobs that were never attempted or never completed. This issue adds a `Pending: N` line for them, exposed through `LifetimeJobStats.pending` next to the existing `unresolved` field.

Spun off from #1029, which added the `Unresolved: N` line and deliberately scoped it to `failed + retryQueue`.

## Problem

When the engine is shut down while paused (no `clearQueues()`), jobs can remain in `enqueued` (never attempted) and, rarely, in `processing` (never completed). `JobRegistry.stats()` already reports both counts, but `LifetimeJobStats` drops them and `RunSummary` never prints them. The run summary therefore gives no sign that work was left undone. Only `Unresolved` (`failed + retryQueue`) is visible.

## Expected Behavior

- The run summary prints `Pending: N`, where `N = enqueued + processing`, **only when N > 0**. Normal runs end with 0, so their output is unchanged.
- `Pending` is outside the failure ratio: it changes neither `Total`, `Failed`, the percentage, `Result:`, nor the exit code.
- Example (paused shutdown with leftover work):

  ```text
  Total: 40
  Failed: 2 (5%)
  Unresolved: 3
  Pending: 57
  Threshold: 10%
  Result: Success
  ```

## Solution

### Decisions

- **`processing` is folded into `Pending`** (no separate label). `pause()`/`shutdown()` wait for workers to go idle, so `processing` is normally 0 at shutdown. It is only non-zero when the idle-wait is cut short, and in that case it is still "work not completed".
- **Single source:** the count lives in `LifetimeJobStats` as a `pending` field, next to `unresolved`, following the pattern from #1023/#1029. `RunSummary` reads `stats.pending` and does not touch raw registry stats.

### Scope

**In scope**

- `LifetimeJobStats`: add a `pending` constructor param, private field and getter. `fromStats()` computes `stats.enqueued + stats.processing`. The docstring says it is reported separately and is never part of `total` or the ratio.
- `RunSummary`: add a `Pending: N` line, printed only when `stats.pending > 0` and placed right after the (optional) `Unresolved:` line, before `Threshold:` / `Result:`. Update the docstrings.
- Agent docs: `docs/agents/flow/failure-handling.md` (mention the `Pending` line next to `Unresolved`) and `docs/agents/deku-swarm.md` (the `LifetimeJobStats` and `RunSummary` rows in the auxiliary-services table).

**Out of scope**

- `FailureChecker` and the exit code: no change.
- `RunReporter`: no change, since it already passes one `LifetimeJobStats` to both consumers.
- Calling `clearQueues()` on a paused shutdown.
- deku-swarm `JobRegistry.stats()` shape (it already exposes `enqueued`/`processing`).
- Exposing pending counts in the dashboard/API (`/stats.json` already returns raw `enqueued`/`processing`).

### Edge cases

- **`total === 0` with pending jobs** (paused before anything finished): `Failed: 0 (0%)`, `Result: Success`, `Pending: N` still printed.
- **Pending without unresolved** (and vice versa): each line is printed independently, only when its own count is > 0.
- `enqueued`, `processing`, `failed`, `retryQueue`, `finished` and `dead` are disjoint collections in `JobRegistryInstance`, so nothing is double-counted between `Pending`, `Unresolved` and the ratio.
- `clearQueues()` (stop/reload) empties the queues, so a normal stop path reports `Pending` as 0 (line hidden).

### Backward compatibility

- Normal runs print exactly the same output. The new line only appears for paused-shutdown runs with leftover work.
- No change to the exit code, the ratio or any public API. The `LifetimeJobStats` constructor gains an optional-in-practice field (internal only).

### Testing strategy

- `LifetimeJobStats_spec`: `pending` equals `enqueued + processing` in `fromStats()`, and does not affect `total`/`dead`/`percentage`.
- `RunSummary_spec`: `Pending:` line present only when `pending > 0`; placed after `Unresolved:` when both exist and after `Failed:` when only pending exists; `total === 0` with pending prints `0%` / `Success`.
- `RunReporter_spec`: with jobs left in `enqueued`, the logged summary contains `Pending: N` and the failure check is unaffected.

## Benefits

- Work left undone after a paused shutdown becomes visible in the run summary instead of being silently omitted.
- Keeps all run-summary counts in one place (`LifetimeJobStats`), consistent with `unresolved` and `percentage`.
- No change to normal-run output or to exit-code semantics.
