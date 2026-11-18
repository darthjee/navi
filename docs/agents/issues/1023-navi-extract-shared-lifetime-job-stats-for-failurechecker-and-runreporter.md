# Issue: Navi: extract shared lifetime job stats for FailureChecker and RunReporter

## Description

Pure internal refactor in `source/lib/services/execution/`: extract the lifetime job-count formula shared by `FailureChecker` and `RunReporter` into a `LifetimeJobStats` value object. Follow-up of #1015, which fixed the formulas inline and deferred deduplication here.

### Scope

In scope:

- A new `LifetimeJobStats` value object built from `JobRegistry.stats()`, exposing:
  - `total` — `total + pruned.finished + pruned.dead`
  - `dead` — `dead + pruned.dead`
  - `unresolved` — `failed + retryQueue` (in-flight jobs, used only by `RunReporter`'s `failedJobs`)
- `FailureChecker#loadStats()` reads `dead`/`total` from it.
- `RunReporter` builds `RunSummary` from it.

Out of scope:

- Changing either formula (including the `failed + retryQueue` numerator/denominator mismatch — see Edge cases).
- Changing `RunSummary`'s constructor: it keeps taking plain `totalJobs`/`failedJobs` numbers and stays a pure formatter, unaware of the registry.
- Any deku-swarm change: `JobRegistry.stats()` is untouched, no package bump.
- Making `FailureChecker` receive the stats snapshot from `RunReporter` instead of reading `JobRegistry.stats()` itself: both reads happen back-to-back after the run is quiescent, so they can't diverge in practice, and it would change `FailureChecker`'s constructor and call sites.

## Problem

After #1015, two places in `source/lib/services/execution/` independently derive lifetime job counts from `JobRegistry.stats()`, adding `pruned` back in:

- `FailureChecker#loadStats()` — `dead + pruned.dead` over `total + pruned.finished + pruned.dead`, feeding the `failure.threshold` exit decision.
- `RunReporter` — `totalJobs: total + pruned.finished + pruned.dead` and `failedJobs: failed + retryQueue + dead + pruned.dead`, feeding `RunSummary`, which prints its own `Result: Success/Failure` line.

The two formulas must stay in agreement or the final log contradicts the exit code (the exact bug #1015 had to fix in `RunSummary.failedJobs`). Keeping them in sync is currently enforced only by a consistency spec.

## Expected Behavior

- One place (`LifetimeJobStats`) computes lifetime `total`, `dead` and `unresolved` counts from `JobRegistry.stats()`.
- `FailureChecker` and `RunReporter` both consume it; neither re-derives `pruned` arithmetic inline.
- Ratios, exit codes and every line of the run summary log are unchanged in all paths.

## Solution

Extract `LifetimeJobStats`, built with `LifetimeJobStats.fromStats(JobRegistry.stats())`, and use it from both `FailureChecker#loadStats()` (`dead`/`total`) and `RunReporter` (`totalJobs = total`, `failedJobs = unresolved + dead`). `FailureChecker` keeps its `#cachedRatio` memoization and `#total === 0` guard.

### Naming and location

- **Class**: `LifetimeJobStats` — "lifetime" is the term #1015 and the existing JSDoc use for resident + pruned since the last `clearQueues()`.
- **File**: `source/lib/services/execution/LifetimeJobStats.js`, next to its two consumers and `RunSummary` (another end-of-run value object). Not `models/`, which holds config/request/response models.
- **Spec**: `source/spec/lib/services/execution/LifetimeJobStats_spec.js`.
- **Factory**: `LifetimeJobStats.fromStats(stats)` — takes the plain `JobRegistry.stats()` object (does not read the registry itself), following the codebase's `fromX` convention and keeping the class pure. Callers: `LifetimeJobStats.fromStats(JobRegistry.stats())`.
- **Constructor**: `{ total, dead, unresolved }`, stored in private fields (like `RunSummary`).
- **Accessors**: read-only getters `total`, `dead`, `unresolved`. No combined `failed` getter: `RunReporter` computes `failedJobs` as `unresolved + dead` itself, keeping the #1029 asymmetry visible at the call site.
- Rejected: a `LifetimeJobStats.current()` reading `JobRegistry` directly (less pure).

### Alternatives

Chosen — **A. `LifetimeJobStats` value object in `source/`**: `LifetimeJobStats.fromStats(JobRegistry.stats())` returning `{ total, dead, unresolved }`, used by both `FailureChecker` and `RunReporter`. Single home for the lifetime formula, independently testable, no deku-swarm change.

Rejected:

- **B. `JobRegistry.lifetimeStats()` in deku-swarm** — new public API forces a deku-swarm minor bump plus cascade, and would bake Navi's notion of "failed" (`failed + retryQueue`) into a generic queue library. Splitting it (`total`/`dead` in deku-swarm, `unresolved` in Navi) still costs a bump for little gain. Worth reconsidering only if another package needs lifetime counts.
- **C. `RunReporter` computes once and passes numbers to `FailureChecker` and `RunSummary`** — the formula moves into `RunReporter` (not independently testable), `FailureChecker`'s constructor changes (out of scope), and `FailureChecker` stops being usable standalone.
- **D. `RunSummary` owns the verdict, `FailureChecker` drops its threshold logic** — merges formatting with exit responsibility, larger refactor, and turns the `failed + retryQueue` mismatch into a behavior change.

### Edge cases

The report runs on the engine's `finish` event, after `finishRun()`. Three paths reach it:

1. **Normal end (queues drained)** — `failed`, `retryQueue`, `enqueued` are 0; both formulas agree. Unaffected by this refactor.
2. **Shutdown while running** — `shutdown()` → `stop()` → `JobRegistry.clearQueues()` resets all collections and `pruned` before `finish`, so the report sees `Total: 0` and `FailureChecker` exits early. Pre-existing, out of scope — tracked in #1028.
3. **Shutdown while paused** — `engine.stop()` runs without `clearQueues()`, so jobs can remain in `failed`/`retryQueue`. `RunSummary` counts them in `failedJobs` (not in `totalJobs`, so the percentage can exceed 100%) while `FailureChecker` ignores them: the summary can say `Failure` while the exit code is 0. This refactor preserves the asymmetry exactly; deciding the right ratio is tracked in #1029.

Decisions:

- **`total === 0`** — `LifetimeJobStats` computes no ratios, so it needs no guard. `FailureChecker` keeps its `#total === 0` early return; `RunSummary` keeps `totalJobs === 0 → 0`.
- **`clearQueues()` resetting `pruned`** — nothing to handle: the object is a snapshot of whatever `stats()` returns at construction.
- **`unresolved` asymmetry** — kept as-is; its JSDoc states that it is not part of `total` and points at #1029.

### Backward compatibility

Pure internal refactor — no observable change:

- **Public API** — `FailureChecker`, `RunReporter` and `RunSummary` are internal (not exported from `source/`, not in `docs/guides`); adding `LifetimeJobStats` breaks nothing for extensions or derived images.
- **Constructors** — `FailureChecker({ failureConfig })` and `RunSummary({ totalJobs, failedJobs, threshold })` unchanged; `RunReporter#report` signature unchanged; `EngineController`/`ApplicationInstance` untouched.
- **Log output** — identical `Total`/`Failed`/`Threshold`/`Result` lines in every edge-case path, including the paused-shutdown asymmetry.
- **Exit codes** — same `FailureChecker` verdict, same `total === 0` early return, same error message.
- **Config** — no new keys, no changed defaults, no doc changes.
- **Version** — no bump: `source/package.json` is already at an unreleased 1.14.4.
- **Guard** — existing `FailureChecker`, `RunReporter` and `RunSummary` specs plus the #1015 consistency spec must pass **without edits**; needing to change one signals a behavior change.

### Testing strategy

Existing specs stub `JobRegistry.stats()` and assert on behavior (`RunSummary` arguments, `process.exit`, log message); since both classes still call `JobRegistry.stats()`, they act as the regression suite.

1. **New `LifetimeJobStats_spec.js`** (pure, literal stats objects):
   - `fromStats`: `total` = `total + pruned.finished + pruned.dead`; `dead` = `dead + pruned.dead`; `unresolved` = `failed + retryQueue`.
   - With `pruned` = `{ finished: 0, dead: 0 }`, returns the resident values.
   - All-zero stats → all zeros, no throw.
   - `unresolved` is **not** included in `total` (pins the #1029 asymmetry).
   - Constructor stores the given values; getters are read-only.
2. **Existing specs pass with no edits**: `FailureChecker_spec.js` (incl. `with pruned counts` and `total is zero`), `RunReporter_spec.js` (incl. the #1015 consistency blocks `with the real JobRegistry and retention` and `with pruned jobs`), `RunSummary_spec.js`.
3. **One new `RunReporter` case** — only if not already covered by `derives totalJobs/failedJobs …`: stats with `failed`/`retryQueue` > 0, asserting `failedJobs` includes them, so #1029 must change it deliberately.
4. **CI**: `yarn test`, `yarn lint`, `yarn report` in `source/`; the new file fully covered.

### Performance & security

Negligible: one extra small object allocated once per run, at report time. No new input, config or attack surface.

## Benefits

- The lifetime formula lives in one tested place, so the summary and exit decision can't silently drift apart again (the #1015 bug class).
- The `unresolved` field makes the in-flight-jobs asymmetry explicit, giving #1029 a single point to change.
- No public API, config, deku-swarm or version impact.
