# Add shared spec helpers
Move the memory-specific fetch stub out of `MemoryStatus_spec.js` and add a small render-in-`act()` helper, both under `frontend/spec/support/`.

- Create `support/fetch_memory_status.js` exporting `mockFetchSuccessWithHistory(statusData)`, moved verbatim from `MemoryStatus_spec.js` including its explanatory comment (URL-aware `fetch` stub: `/memory/history.json` gets `[]`, anything else gets `statusData`). It must not import from `frontend/src`.
- Add `renderInAct(root, element)` to `support/dom.js` next to `useContainer`: `await act(async () => { root.render(element); })`, and export it.
- Do not touch `support/fetch.js`, which ships verbatim in the navi-hey-test image.

## Files to Change
- `frontend/spec/support/fetch_memory_status.js` — new file holding `mockFetchSuccessWithHistory`
- `frontend/spec/support/dom.js` — add and export `renderInAct`
