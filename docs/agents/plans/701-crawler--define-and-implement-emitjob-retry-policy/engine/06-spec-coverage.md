# Spec coverage

Cover every behavior decided in the issue: defaults, per-resource override, the retryable/non-retryable split, `Retry-After` handling (including the cap and malformed/HTTP-date fallback), and the `RegistriesBuilder` wiring.

- `EmitJob`: default `maxRetries`/`cooldown` (5/5000ms) when no `emit.retries`/`emit.cooldown` is set; resource override applied when set; `maxRetries` forces immediate exhaustion (`_attempts`) on a non-retryable 4xx and stays at the configured value for 5xx/429/408/network errors; `cooldown` returns the capped `Retry-After` value on 429 with a parseable header, and the normal cooldown otherwise (missing header, non-numeric, HTTP-date, non-429).
- `ResourceRequestEmit`: valid `retries`/`cooldown` accepted and exposed; `retries: 0` accepted; invalid values throw `InvalidEmitRetries`/`InvalidEmitCooldown`.
- `RequestFailed`/`Client`: `headers` carried through both `#handleResponse` and `#handleError` construction sites.
- `RegistriesBuilder`: `ResourceRequestJob`/`AssetDownload` factories receive the global `maxRetries`/`cooldown` attributes; `Emit` factory does not.

## Files to Change

- `source/spec/lib/jobs/EmitJob_spec.js`
- `source/spec/lib/models/request/ResourceRequestEmit_spec.js`
- `source/spec/lib/exceptions/request/RequestFailed_spec.js` (new)
- `source/spec/lib/exceptions/config/InvalidEmitRetries_spec.js` (new)
- `source/spec/lib/exceptions/config/InvalidEmitCooldown_spec.js` (new)
- `source/spec/lib/client/Client_spec.js`
- `source/spec/lib/services/builders/RegistriesBuilder_spec.js`
