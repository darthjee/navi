# Add EmitJob specs

New `source/spec/lib/jobs/EmitJob_spec.js`, following `ResourceRequestJob_spec.js`'s structure and helpers (`LoggerUtils.stubLoggerMethods()`, `EmitJobFactory`/`ResourceRequestEmitFactory` from Step 05, `AxiosUtils` stubs from Step 05). Cover:

- A successful emit: `perform` resolves, and the stubbed axios call received the item as the JSON body at the resolved URL, via the configured method.
- Each supported HTTP method (POST, PUT, PATCH) is dispatched correctly.
- URL placeholder substitution: an `emit.url` containing `{:field}` is resolved using the extracted item's/parameters' field values before the request is sent.
- Default-2xx success vs. explicit `status`: mirrors the `Client`-level cases from Step 06, but asserted end-to-end through `EmitJob#perform`.
- A failing emit (stubbed rejection or non-matching status) that eventually succeeds after retries — assert `_fail`/`lastError`/attempt-count behavior the same way `ResourceRequestJob_spec.js` does, and that a subsequent `perform` call succeeds once the stub is reconfigured.
- A failing emit that exhausts retries — assert `job.exhausted()` becomes `true` after `maxRetries` (inherited default `3`) failed attempts, and that `EmitJob` does **not** override `maxRetries` (unlike `ExtractionJob`).

## Files to Change

- `source/spec/lib/jobs/EmitJob_spec.js` — new file, full spec coverage per the issue's acceptance criteria.
