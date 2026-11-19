# Print the `Pending:` line in RunSummary

In `report()`, add `...this.#pendingLines()` right after `...this.#unresolvedLines()` and before `Threshold:`. Add a private `#pendingLines()` returning `[\`Pending: ${this.#stats.pending}\`]` when `this.#stats.pending > 0`, else `[]` (same shape as `#unresolvedLines()`). Update the `report()`/class docstrings to mention the optional `Pending` line. `percentage()` and `result()` are unchanged.

Specs (`RunSummary_spec.js`): extend the `build` helper with `pending = 0` and pass it to `LifetimeJobStats`. Add:

- the `Pending` line is omitted when pending is 0;
- with only pending jobs, it comes right after `Failed:`: `'Total: 10\nFailed: 4 (40%)\nPending: 5\nThreshold: 30%\nResult: Failure'`;
- with both unresolved and pending, the order is `Failed:`, `Unresolved:`, `Pending:`, `Threshold:`, `Result:`;
- with zero total and pending jobs, it prints `Failed: 0 (0%)`, `Pending: N` and `Result: Success`;
- pending jobs do not change `percentage()` or `result()`.

## Files to Change

- `source/lib/services/execution/RunSummary.js` — `#pendingLines()` and the `report()` wiring.
- `source/spec/lib/services/execution/RunSummary_spec.js` — helper and the new cases.
