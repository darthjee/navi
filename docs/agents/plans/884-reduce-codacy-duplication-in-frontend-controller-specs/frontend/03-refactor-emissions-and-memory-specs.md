# Refactor Emissions and MemoryChart specs
Replace the duplicated scenarios with a call to the shared example, and import the shared helpers instead of the local `flushAsync`/`flushMany`/`mockResponses`.

- **Emissions:** keep the `counts` assertions ("passes the counts and rows to `setData`" counts part, "still reports the counts" on an empty response) and the `.build` spec.
- **MemoryChart:** keep the `MAX_POINTS` cap and "newest points" scenarios, the `last_id` cursor URL scenario, the fail-then-recover scenario (with its real 1050 ms wait) and the `.build` spec.
- Every assertion that existed before must still exist, either in the shared example or in the spec.

## Files to Change
- `frontend/spec/components/controllers/EmissionsController_spec.js` — use shared example and helpers
- `frontend/spec/components/controllers/MemoryChartController_spec.js` — use shared example and helpers
