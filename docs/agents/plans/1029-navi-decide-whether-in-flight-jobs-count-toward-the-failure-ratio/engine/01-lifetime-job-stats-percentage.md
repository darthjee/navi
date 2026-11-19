# Add LifetimeJobStats.percentage
Add a `percentage` getter to `LifetimeJobStats` returning `(dead / total) * 100`, or `0` when `total === 0`. This becomes the single source of the failure ratio.

Also rewrite the `unresolved` getter's docstring: drop the "whether it belongs in the failure ratio is tracked in #1029" sentence and state that it counts in-flight jobs (`failed + retryQueue`), reported separately and never part of the ratio.

Specs: `percentage` for a normal case, `total === 0` → `0`, and a case with pruned finished/dead counts (via `fromStats`) to confirm lifetime counts are used. Confirm `unresolved` does not affect `percentage`.

## Files to Change
- `source/lib/services/execution/LifetimeJobStats.js` — add `percentage` getter; update `unresolved` docstring.
- `source/spec/lib/services/execution/LifetimeJobStats_spec.js` — specs for `percentage`.
