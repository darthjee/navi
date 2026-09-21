# Refactor MemoryStatus_spec
Reduce duplication in `MemoryStatus_spec.js` while keeping every scenario and assertion.

- Import `flushAsync` from `../support/async.js` and delete the local copy; import `mockFetchSuccessWithHistory` from `../support/fetch_memory_status.js` and delete the local copy.
- Replace the hand-written "while loading" and "when the fetch fails" blocks with `itBehavesLikeFetchStates({ state, render: () => renderMemoryStatus(state.root), loadingText: 'Loading memory status', errorText: 'Failed to load memory status', status: 503 })` (import from `../support/fetch_states.js`; drop the now-unused `noop` and `mockFetchFailure` imports). Same pattern as `Jobs_spec.js`.
- Table-drive the five per-status scenarios: an array of `{ description, data, colorClass }` (`with status low`, `with status medium`, `with status high`, `with status over and percentage at exactly 100`, `with status over and percentage exceeding 100`) iterated with `forEach`, each generating `describe(description)` with `mockFetchSuccessWithHistory(data)`, the shared `beforeEach` (render + `flushAsync`), the "applies the … color class" `it` (`.text-memory-<x>` not null) and the "renders the memory usage chart" `it`.
- Keep the status-specific extras outside the table so no assertion is lost: for `low`, "does not show a spinner", "shows the status label", "shows the formatted byte values" (`25.0 MB`, `100.0 MB`); for over-above-100, "does not apply the plain over color class". Either extra `it`s inside the row's `describe` via an optional per-row callback, or a second small `describe` that reuses the same payload — pick whichever reads better.
- Keep the existing per-status wording of the color-class `it` titles where feasible (dark gray / green / yellow / red / purple over-limit), e.g. via an optional `label` column.

## Files to Change
- `frontend/spec/components/MemoryStatus_spec.js` — use shared helpers and table-drive the per-status scenarios
