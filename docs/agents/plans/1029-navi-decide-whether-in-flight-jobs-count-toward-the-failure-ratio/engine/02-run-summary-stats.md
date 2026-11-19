# RunSummary consumes LifetimeJobStats and prints Unresolved
Change the constructor to `new RunSummary({ stats, threshold = null })`, where `stats` is a `LifetimeJobStats`.

- `percentage()` returns `stats.percentage` (no own math).
- `result()` keeps its current threshold logic (`> threshold` → `'Failure'`, no threshold → `'Success'`).
- `report()` prints, in order: `Total: <stats.total>`, `Failed: <stats.dead> (<pct>%)`, then `Unresolved: <stats.unresolved>` **only when `stats.unresolved > 0`**, then `Threshold: ...`, `Result: ...`.
- Update JSDoc (the old `failedJobs` "failed + retry + dead" wording goes away).

Rewrite `RunSummary_spec.js` for the new constructor (build stats with `new LifetimeJobStats({ total, dead, unresolved })`). Cover: existing percentage/result/report cases; `Unresolved:` line absent when `unresolved === 0`; present and placed after `Failed:` when > 0; `total === 0` with unresolved jobs prints `Failed: 0 (0%)`, `Unresolved: N`, `Result: Success`; with unresolved jobs the percentage never exceeds 100%.

## Files to Change
- `source/lib/services/execution/RunSummary.js` — new constructor, delegate percentage, conditional `Unresolved:` line, docstrings.
- `source/spec/lib/services/execution/RunSummary_spec.js` — rewritten for the new constructor plus the new cases.
