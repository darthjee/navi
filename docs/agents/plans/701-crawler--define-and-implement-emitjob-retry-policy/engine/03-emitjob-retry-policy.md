# EmitJob's own retry policy

The core of the issue: `EmitJob` gets a default retry policy distinct from the global config, overridable per resource, that distinguishes retryable from non-retryable failures and honors a capped `Retry-After`.

- Two constants, e.g. `EmitJob.DEFAULT_MAX_RETRIES = 5` and `EmitJob.DEFAULT_COOLDOWN = 5000`, and a `RETRY_AFTER_CAP_MS = 60000` constant.
- Constructor computes the effective `maxRetries`/`cooldown` from `emit.retries ?? DEFAULT_MAX_RETRIES` / `emit.cooldown ?? DEFAULT_COOLDOWN` and stores them (do **not** pass the global `workersConfig` values here — `EmitJob` never receives those, see [Shared contracts](../engine.md)).
- `get maxRetries()` override: when `this.lastError` is a `RequestFailed` whose `statusCode` is **not** one of the retryable statuses (5xx, 429, 408) — i.e. any other 4xx — return `this._attempts` to force immediate exhaustion, regardless of the configured retry count. Otherwise return the stored effective `maxRetries`. A network-level error (no `RequestFailed`, i.e. `lastError` isn't an instance of it) is always retryable.
- `get cooldown()` override: when `this.lastError` is a `RequestFailed` with `statusCode === 429` and carries a parseable numeric `Retry-After` header (delta-seconds form only — an HTTP-date value is treated as unparseable), return `Math.min(retryAfterMs, RETRY_AFTER_CAP_MS)`. Otherwise return the stored effective `cooldown`.
- A `Retry-After`-driven wait still consumes a retry attempt exactly like any other failure — no special-casing of `_attempts`.

## Files to Change

- `source/lib/jobs/EmitJob.js` — add the constants, effective-value computation, and the two getter overrides described above.
