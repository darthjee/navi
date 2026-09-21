# Refactor Logs and Extractions specs
Apply only the low-level helpers; do not force these specs into the polling shared example.

- **Logs:** replace the local `flushAsync` with the `act`-wrapped one; collapse the repeated `cancelledRef`/`lastIdRef`/`setLogs`/`buildPollingEffect` setup in the three `#buildPollingEffect` describes (and the repeated `fetchLogs` spy + `LogsController.build` in `#buildScrollEffect`) into small local or shared helpers, keeping every scenario and assertion.
- **Extractions:** replace the local `flushAsync` and the `setData`/`setError`/`setLoading` `beforeEach` with the shared helpers, and reuse the shared "feed fails" block (`HTTP 500` reported, loading stopped). Its interval-based scenarios (`mockPair`, joins, partial flags, `clearInterval` cleanup) stay as they are.

## Files to Change
- `frontend/spec/components/controllers/LogsController_spec.js` — use shared helpers, remove local duplication
- `frontend/spec/components/controllers/ExtractionsController_spec.js` — use shared helpers and the failure block
