# Add MemoryChartController spec

Add `frontend/spec/components/controllers/MemoryChartController_spec.js`, copying
the structure of `frontend/spec/components/Emissions_spec.js` /
`frontend/spec/components/controllers/LogsController_spec.js`:

- Stub `fetch` with `mockFetchSuccess` / `mockFetchFailure` from
  `frontend/spec/support/fetch.js`.
- Use real timers with `flushAsync = () => act(async () => new Promise(r => setTimeout(r, 0)))`
  (no `jasmine.clock`).
- Cover:
  - First load populates `#points` and calls `setData`.
  - A response advances `?last_id=` (via `lastIdRef`) and appends new entries on
    the next poll.
  - The `MAX_POINTS` cap holds after repeated appends.
  - An error response calls `setError` with the error message and recovers
    (retries and clears the error) on the next successful poll.

## Files to Change

- `frontend/spec/components/controllers/MemoryChartController_spec.js` — new spec
  file for `MemoryChartController`.
