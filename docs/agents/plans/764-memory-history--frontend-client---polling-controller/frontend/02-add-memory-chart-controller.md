# Add MemoryChartController

Add `frontend/src/components/elements/controllers/MemoryChartController.jsx`, a
class combining `LogsController`'s fetch-fn injection with `EmissionsController`'s
accumulator/capping/emit split:

- Constructor `(fetchMemoryHistory, setData, setError, setLoading)`; private fields
  `#fetchMemoryHistory`, `#setData`, `#setError`, `#setLoading`, `#points` (`= []`).
- Static `build(fetchMemoryHistory, setData, setError, setLoading)` factory.
- `buildPollingEffect(cancelledRef, lastIdRef)` returns the effect thunk: resets
  `cancelledRef.current = false`, kicks `#poll`, returns a cleanup that flips
  `cancelledRef.current = true`.
- `#poll(cancelledRef, lastIdRef)`: bail if cancelled; call
  `this.#fetchMemoryHistory({ lastId: lastIdRef.current })`, `.then` →
  `#handleResponse`, `.catch` → `#handleError`.
- `#handleResponse(entries, cancelledRef, lastIdRef)`: bail if cancelled;
  `setLoading(false)`, `setError(null)`; on non-empty `entries`, advance
  `lastIdRef.current` to the last entry's `id`, append and cap
  `this.#points = [...this.#points, ...entries].slice(-MAX_POINTS)`
  (`MAX_POINTS = 200`), `#emit()` (`setData(this.#points)`), then re-poll
  immediately; on empty, `setTimeout(#poll, POLL_DELAY_MS)` (`POLL_DELAY_MS = 1000`).
- `#handleError(err, cancelledRef, lastIdRef)`: bail if cancelled;
  `setLoading(false)`, `setError(err.message)`, retry after `POLL_DELAY_MS` if not
  cancelled.

## Files to Change

- `frontend/src/components/elements/controllers/MemoryChartController.jsx` — new
  file, default-exports `MemoryChartController`.
