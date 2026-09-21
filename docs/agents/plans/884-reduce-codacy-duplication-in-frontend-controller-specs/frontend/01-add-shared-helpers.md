# Add shared low-level helpers
Move the helpers copy-pasted across the controller specs into `frontend/spec/support/`, next to the existing `fetch.js` and `async.js`.

- `mockResponses(payloads)` — stubs `globalThis.fetch` with a bounded sequence of successful JSON payloads; the last payload repeats for extra calls (identical in Emissions and MemoryChart, keep the explanatory comment from MemoryChart).
- `flushMany(times = 5)` — calls the `act`-wrapped `flushAsync` repeatedly (identical in Emissions and MemoryChart).
- A small builder for the recurring spy/ref state (`setData`, `setError`, `setLoading`, `cancelledRef`, `lastIdRef`) so specs stop repeating the `beforeEach` that creates them. Name and shape should read naturally at the call site; Extractions only needs the three spies.

## Files to Change
- `frontend/spec/support/fetch.js` — add and export `mockResponses`
- `frontend/spec/support/async.js` — add and export `flushMany`
- `frontend/spec/support/controller_state.js` (new) — spy/ref builder used by the controller specs
