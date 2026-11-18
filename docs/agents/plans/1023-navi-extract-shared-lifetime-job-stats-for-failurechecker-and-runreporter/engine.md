# Engine Plan: Navi: extract shared lifetime job stats for FailureChecker and RunReporter

Main plan: [plan.md](plan.md)

## Overview

Add `LifetimeJobStats` (`source/lib/services/execution/LifetimeJobStats.js`) as the single place that turns a `JobRegistry.stats()` object into lifetime counts, then make `FailureChecker` and `RunReporter` consume it. Behavior is byte-for-byte identical; the existing specs are the regression guard and must pass **without edits**.

## Context

After #1015 both classes add `pruned` back in independently:

- `FailureChecker#loadStats()`: `dead + pruned.dead` over `total + pruned.finished + pruned.dead`.
- `RunReporter#report()`: `totalJobs = total + pruned.finished + pruned.dead`, `failedJobs = failed + retryQueue + dead + pruned.dead`.

`JobRegistry.stats().total` is `dead + finished` only, so `failed + retryQueue` sit in `RunSummary`'s numerator but not its denominator. This asymmetry is deliberately preserved here (tracked in #1029); the shutdown-zeroes problem is tracked in #1028. Neither is touched by this plan.

## Implementation Steps

### Step 1 — Add `LifetimeJobStats` with its spec

Create `source/lib/services/execution/LifetimeJobStats.js`, following `RunSummary`'s style (private fields, JSDoc on every member, `@author darthjee`, named export):

```js
class LifetimeJobStats {
  #total;
  #dead;
  #unresolved;

  constructor({ total, dead, unresolved }) { ... }   // stores values as-is

  static fromStats(stats) {
    return new LifetimeJobStats({
      total:      stats.total + stats.pruned.finished + stats.pruned.dead,
      dead:       stats.dead + stats.pruned.dead,
      unresolved: stats.failed + stats.retryQueue,
    });
  }

  get total() { ... }
  get dead() { ... }
  get unresolved() { ... }
}

export { LifetimeJobStats };
```

- Getters only (no setters), so the values are read-only.
- No ratio computation and no zero guard — callers keep theirs.
- JSDoc on `unresolved` must state that it counts in-flight jobs (`failed + retryQueue`), is **not** part of `total`, and that whether it belongs in the failure ratio is tracked in #1029.
- No combined `failed` getter.
- Do not read `JobRegistry` inside the class (no `current()` helper).

Create `source/spec/lib/services/execution/LifetimeJobStats_spec.js` (Jasmine, literal stats objects, no registry):

- `.fromStats` computes `total = total + pruned.finished + pruned.dead`, `dead = dead + pruned.dead`, `unresolved = failed + retryQueue`.
- With `pruned: { finished: 0, dead: 0 }` it returns the resident `total`/`dead`.
- All-zero stats yield all zeros without throwing.
- `unresolved` is not added into `total` (e.g. `failed: 2, retryQueue: 3` leaves `total` unchanged).
- `new LifetimeJobStats({...})` exposes the given values; assigning to a getter does not change it (in strict-mode ESM a getter-only assignment throws `TypeError` — assert whichever the module mode gives, value unchanged either way).

### Step 2 — Wire it into `FailureChecker` and `RunReporter`, update agent docs

`source/lib/services/execution/FailureChecker.js`:

- `#loadStats()` becomes:

  ```js
  const stats = LifetimeJobStats.fromStats(JobRegistry.stats());
  this.#dead = stats.dead;
  this.#total = stats.total;
  ```

- Keep `#cachedRatio`, the `#total === 0` guard, the error message and constructor exactly as they are.

`source/lib/services/execution/RunReporter.js`:

- Build the summary from the value object:

  ```js
  const stats = LifetimeJobStats.fromStats(JobRegistry.stats());
  const summary = new RunSummary({
    totalJobs: stats.total,
    failedJobs: stats.unresolved + stats.dead,
    threshold: failureConfig?.threshold,
  });
  ```

- `report()` signature and the summary-then-check ordering unchanged.

`docs/agents/deku-swarm.md` ("Engine auxiliary services" table, ~line 195–200):

- Add a `LifetimeJobStats` row (file path, responsibility: converts `JobRegistry.stats()` into lifetime `total`/`dead`/`unresolved` counts, resident + pruned since the last `clearQueues()`; note: shared by `FailureChecker` and `RunReporter`).
- Update the `FailureChecker` row's responsibility to say it reads lifetime counts via `LifetimeJobStats`.
- Mention `LifetimeJobStats` alongside `FailureChecker`/`RunSummary` in the list at ~line 208 if it enumerates these services.

Do **not** edit `FailureChecker_spec.js`, `RunReporter_spec.js` or `RunSummary_spec.js`. The issue's optional extra `RunReporter` case for nonzero `failed`/`retryQueue` is **not needed**: `RunReporter_spec.js`'s `derives totalJobs/failedJobs from JobRegistry.stats()…` already stubs `failed: 2, retryQueue: 3` and asserts `Failed: 6`.

## Files to Change

- `source/lib/services/execution/LifetimeJobStats.js` — new value object.
- `source/spec/lib/services/execution/LifetimeJobStats_spec.js` — new pure spec.
- `source/lib/services/execution/FailureChecker.js` — `#loadStats()` uses `LifetimeJobStats`.
- `source/lib/services/execution/RunReporter.js` — builds `RunSummary` from `LifetimeJobStats`.
- `docs/agents/deku-swarm.md` — services table/list updated.

## CI Checks

- `source`: `yarn test` (CI job: `jasmine`)
- `source`: `yarn lint` and `yarn report` (CI job: `checks`) — the new file must be fully covered.

## Notes

- No version bump: `source/package.json` is already at an unreleased 1.14.4.
- No user-facing docs change (`docs/guides`), no config change, no deku-swarm change.
- If any existing spec needs an edit to pass, stop: that means behavior changed, which is out of scope.
