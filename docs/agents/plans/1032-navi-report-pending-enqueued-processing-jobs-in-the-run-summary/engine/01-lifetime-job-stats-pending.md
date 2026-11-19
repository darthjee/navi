# Add `pending` to LifetimeJobStats

Add a `pending` count to the value object, next to `unresolved`.

- Constructor: accept `pending = 0` (default keeps existing callers working); store in a private `#pending` field. Document the param in the JSDoc (`params.pending` — count of not-yet-attempted/completed jobs, `enqueued + processing`).
- `fromStats(stats)`: pass `pending: stats.enqueued + stats.processing`.
- Add a `get pending()` getter with a docstring saying it is reported separately and is never part of `total` or of the failure ratio (mirroring `unresolved`'s docstring).
- Update the class docstring if it enumerates the fields.

Specs (`LifetimeJobStats_spec.js`):

- `fromStats()` sets `pending` to `enqueued + processing`.
- `pending` does not affect `total`, `dead` or `percentage`.
- `pending` defaults to `0` when not given to the constructor.

## Files to Change

- `source/lib/services/execution/LifetimeJobStats.js` — new `pending` field, constructor param, `fromStats()` mapping, getter.
- `source/spec/lib/services/execution/LifetimeJobStats_spec.js` — cases above.
