# Issue: Navi: exclude in-flight jobs from the failure ratio and report them separately

## Description

The final run summary (`RunSummary`, printed by `RunReporter`) and the exit decision (`FailureChecker`) use different definitions of the failure ratio. This issue settles on one definition (only terminal jobs count) and moves the ratio into `LifetimeJobStats` so both read it from the same place. In-flight jobs are reported on their own summary line instead of skewing the ratio.

Surfaced while refining #1023, which extracted `LifetimeJobStats` (now merged) as a pure refactor and deliberately kept this asymmetry via its `unresolved` field.

## Problem

`RunSummary` and `FailureChecker` disagree on whether in-flight jobs count toward the failure ratio:

- `RunReporter` builds `RunSummary` with `failedJobs = failed + retryQueue + dead + pruned.dead` but `totalJobs = total + pruned.finished + pruned.dead`, where `JobRegistry.stats().total` is only `dead + finished`. Jobs in `failed`/`retryQueue` are in the numerator but not the denominator, so the percentage can exceed 100%.
- `FailureChecker` uses only `dead + pruned.dead` (`LifetimeJobStats.dead`) over the same denominator.

On a normal end both `failed` and `retryQueue` are 0, so they agree. When the engine is shut down while paused (no `clearQueues()`), jobs can remain in `failed`/`retryQueue`: the summary can print `Result: Failure` while the process exits 0.

The ratio math is also duplicated (`RunSummary.percentage()` vs `FailureChecker.#ratio()`), which is what let the two definitions drift apart.

## Expected Behavior

One consistent definition of the failure ratio, used by both the printed summary and the exit decision, with a denominator that includes whatever the numerator counts.

- The ratio is `dead / (finished + dead)` (lifetime: resident + pruned) everywhere.
- The summary's `Result:` always agrees with the process exit code.
- Jobs left in `failed`/`retryQueue` at shutdown are visible on an `Unresolved: N` line (only when N > 0), outside the ratio.

## Solution

### Decision

Count only **terminal** jobs in the failure ratio, and report in-flight jobs on a separate line, outside the ratio:

- **Ratio** (both `RunSummary` and `FailureChecker`): `dead / total`, where `dead = dead + pruned.dead` and `total = finished + dead` (resident + pruned) — i.e. what `LifetimeJobStats.dead` / `LifetimeJobStats.total` already provide. `RunReporter` stops adding `unresolved` into `failedJobs`.
- **In-flight jobs** (`failed + retryQueue`, `LifetimeJobStats.unresolved`) are shown on an extra `Unresolved: N` summary line, printed **only when N > 0** (normal runs always end with 0, so their output is unchanged).
- The `Failed:` label is **kept** (no rename to `Dead:`) to avoid breaking anyone grepping logs; only the docstrings change to say it counts dead jobs.
- Exit-code behaviour is unchanged: `FailureChecker` already uses this definition, so a pause-then-stop run never starts failing because of in-flight jobs. The summary's `Result:` now always agrees with the exit code.

#### Options considered

- **Terminal only, in-flight hidden** — consistent, but silently hides jobs left in `failed`/`retryQueue` after a paused shutdown.
- **In-flight in numerator and denominator** — would treat "not yet retried at shutdown" as failure, changing the exit code for intentional pause-and-stop runs and conflating "gave up" with "didn't get to retry".

### Approach — single source for the ratio

The duplicated ratio math (`RunSummary.percentage()` vs `FailureChecker.#ratio()`) is what let the two drift apart. The ratio moves to `LifetimeJobStats.percentage`, and both `RunSummary` and `FailureChecker` consume a `LifetimeJobStats` instance, so the definition of failure lives in one place.

Alternatives considered:

- **Keep the duplication, pass identical numbers** — smallest diff, but nothing structurally prevents future drift.
- **`percentage` on `LifetimeJobStats`, `RunSummary` still takes raw numbers** — only halves the duplication.
- **`RunSummary` asks `FailureChecker` for its verdict** — couples the summary to a side-effecting (`process.exit`) class.

### Scope

**In scope**

- `LifetimeJobStats` — add a `percentage` getter (`dead / total * 100`, `0` when `total === 0`); keep `unresolved` (it now feeds the new line) and drop the "tracked in #1029" note from its docstring, describing its actual use.
- `RunSummary` — constructor becomes `new RunSummary({ stats, threshold })` taking a `LifetimeJobStats`; reads `stats.total`, `stats.dead`, `stats.unresolved`, and `stats.percentage` instead of computing its own; prints the `Unresolved: N` line only when `stats.unresolved > 0`; docstrings updated.
- `FailureChecker` — replace the private `#ratio()` with `stats.percentage` (no behaviour change).
- `RunReporter` — build one `LifetimeJobStats` and pass it to both `RunSummary` and `FailureChecker`.
- Agent docs — `docs/agents/flow/failure-handling.md` (the `RunSummary.failedJobs includes pruned.dead` note → both classes read `LifetimeJobStats.percentage`; mention the `Unresolved` line) and `docs/agents/deku-swarm.md` (the `FailureChecker`/`RunSummary` rows in the auxiliary-services table). No user-facing guide documents the summary output, so none needs changes.

**Out of scope**

- `FailureChecker` behaviour — it already uses the chosen definition (only its ratio source changes).
- Unifying the duplicated `> threshold` check in `RunSummary.result()` and `FailureChecker` — a larger refactor.
- Calling `clearQueues()` on a paused shutdown (changing what remains in-flight at exit) — a separate engine decision.
- deku-swarm `JobRegistry.stats()` shape.
- Exposing in-flight counts in the dashboard/API.

### Edge cases

- **`total === 0` with in-flight jobs** (paused before anything reached a terminal state, then shut down): `stats.percentage` is `0`, `FailureChecker` skips (as today), `Result: Success`, and the `Unresolved: N` line is still printed:

  ```text
  Total: 0
  Failed: 0 (0%)
  Unresolved: 12
  Threshold: 10%
  Result: Success
  ```

- **`enqueued` / `processing` jobs at shutdown** are *not* counted in `Unresolved`, which stays `failed + retryQueue` ("failed at least once, not yet given up on"). Reporting never-attempted work is a separate concern, spun off as #1032.
- **"Retry dead jobs"** (`JobRegistryInstance` moves failed/dead jobs back into `retryQueue`): if the run is shut down right after, those jobs count as unresolved, not dead — correct, since they are no longer given up on. No special handling.
- **No threshold configured**: `Threshold: N/A`, `Result: Success` as today; `Unresolved` still printed when > 0.
- **Line placement**: `Unresolved:` goes right after `Failed:`, before `Threshold:` / `Result:`.
- `failed`, `retryQueue`, `finished` and `dead` are disjoint collections in `JobRegistryInstance`, so no job is double-counted.

### Backward compatibility

- **Exit code** — unchanged: `FailureChecker` already uses the chosen definition.
- **`Failed:` count / `Result:` line** — change only for paused-shutdown runs with jobs left in `failed`/`retryQueue`: the count drops (in-flight jobs no longer counted) and `Result:` now matches the exit code. Normal runs print exactly the same output.
- **New `Unresolved:` line** — printed only when > 0, so normal runs are unaffected. The summary's line layout was never a documented contract.
- **`RunSummary` constructor** (`{ stats, threshold }`) — internal only: it is not exported and is only built by `RunReporter`; only its specs change.
- No CHANGELOG/release note is needed.

### Testing strategy

- `LifetimeJobStats` spec — `percentage` (normal case, `total === 0` → `0`, pruned counts included).
- `RunSummary` spec — rewritten for the `{ stats, threshold }` constructor; `Unresolved:` line present only when `unresolved > 0` and placed after `Failed:`; `total === 0` with unresolved jobs prints `0%` / `Success`; percentage never exceeds 100% with in-flight jobs.
- `FailureChecker` spec — uses `stats.percentage`; existing threshold cases still pass.
- `RunReporter` spec — with jobs left in `failed`/`retryQueue`, the printed `Result:` agrees with whether `FailureChecker` exits (regression for this issue).
- `Application_shutdown_threshold_spec` — still green; extend if it covers a paused shutdown.

## Benefits

- The printed summary can no longer contradict the exit code, and the percentage can no longer exceed 100%.
- One definition of failure, in one place (`LifetimeJobStats.percentage`), so future changes can't reintroduce drift.
- Jobs left unresolved after a paused shutdown are visible instead of silently inflating (or being hidden from) the ratio.
