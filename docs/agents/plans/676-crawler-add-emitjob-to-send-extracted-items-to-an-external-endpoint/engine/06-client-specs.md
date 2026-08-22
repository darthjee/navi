# Add Client specs for the new method

Extend `source/spec/lib/services/Client_spec.js` (Jasmine — `describe`/`it`/`expectAsync`/`spyOn`, no separate mocking library) with a new `describe` block for the Step 02 method, using `ClientFactory` for setup and the new `AxiosUtils.stubPost`/`stubPut`/`stubPatch`/rejection helpers from Step 05. Cover:

- Each of POST, PUT, and PATCH succeeds and sends the given body as the JSON payload, reusing the client's `base_url`, `headers`, `timeout`.
- Default success: any 2xx response (e.g. 200, 201, 204) is treated as success when no `expectedStatus` is passed.
- Explicit `expectedStatus`: only that exact status counts as success; a different status (even a 2xx one) throws `RequestFailed`.
- A non-2xx response without an explicit `expectedStatus` throws `RequestFailed`.
- A network error (stubbed via the `*Rejection` helpers, no `response` on the error) propagates as a failure (mirrors the existing GET rejection spec's assertions).

## Files to Change

- `source/spec/lib/services/Client_spec.js` — add the new method's spec coverage.
