# Wire ExtractionJob and EmitJob to record

Make the two crawler jobs write to `EmissionRegistry`. Both call static methods directly
(no constructor injection — matches the chosen `LogRegistry`-style wiring); the write
helpers no-op when the registry is unbuilt (step 03), so no other constructor or
`RegistriesBuilder` change is needed.

## ExtractionJob (`source/lib/jobs/ExtractionJob.js`)

In `perform()`, right after
`const items = parserImpl.extract(this.#rawBody, this.#parser.attributes);` and its
`logContext.debug(... extracted N item(s) ...)` line, add
`EmissionRegistry.incExtracted(items.length);`. This counts every extracted item, whether
or not `this.#emit` is set. Import `EmissionRegistry` from `../registry/EmissionRegistry.js`.

## EmitJob (`source/lib/jobs/EmitJob.js`)

Import `EmissionRegistry` from `../registry/EmissionRegistry.js`. Resolve
`const url = this.#emit.resolveUrl(this.#parameters);` once and reuse it (it is already
computed inside the `try`). `method` is `this.#emit.method`. Derive a compact `itemRef`
from `this.#item` (e.g. `this.#item?.id ?? null` — a small helper `#itemRef()` keeps
`perform` readable; never pass the whole payload).

- **On success** (after `const response = await ... .emit(...)`, before `return response`):
  `EmissionRegistry.recordEmission({ status: 'success', url, method, httpStatus: response?.status ?? null, itemRef: this.#itemRef() });`
- **In `catch (error)`** (before `this._fail(error)`): compute
  `const dead = this._attempts >= this.maxRetries;` and
  `const httpStatus = error instanceof RequestFailed ? error.statusCode : null;`, then
  `EmissionRegistry.recordEmission({ status: dead ? 'dead' : 'failed', url, method, httpStatus, error: String(error), itemRef: this.#itemRef() });`
  Keep this synchronous and ahead of `this._fail(error)` (which rethrows). Note
  `this.maxRetries` already returns `this._attempts` for a non-retryable 4xx, so that path
  correctly yields `dead`.

Confirm the `url`/`method` values line up with `get arguments()` so the endpoint and job
serializer agree.

## Specs

- `EmitJob_spec.js` — build `EmissionRegistry` in `beforeEach`, `reset()` in `afterEach`.
  Cover: success records `status: 'success'` + increments `emitted`; a retryable failure
  (5xx / network error, attempts below max) records `status: 'failed'` + increments
  `failed`; an exhausted failure records `status: 'dead'` + increments `dead`; a
  non-retryable 4xx records `status: 'dead'`; `url`/`method`/`httpStatus`/`itemRef` on the
  record are correct. Add one example asserting `perform` still works (no throw) when
  `EmissionRegistry` has **not** been built (write helper no-ops).
- `ExtractionJob_spec.js` — build/reset `EmissionRegistry`; assert `incExtracted` is called
  with the item count for both the `emit` and no-`emit` paths; assert unbuilt-registry
  path still performs.

100% diff coverage.

## Files to Change

- `source/lib/jobs/ExtractionJob.js` — `EmissionRegistry.incExtracted(items.length)` after extraction.
- `source/lib/jobs/EmitJob.js` — record `success` / `failed` / `dead` on each outcome; add `#itemRef()` helper.
- `source/spec/lib/jobs/EmitJob_spec.js` — cover the three outcomes + unbuilt-registry safety.
- `source/spec/lib/jobs/ExtractionJob_spec.js` — cover `incExtracted` wiring + unbuilt-registry safety.
