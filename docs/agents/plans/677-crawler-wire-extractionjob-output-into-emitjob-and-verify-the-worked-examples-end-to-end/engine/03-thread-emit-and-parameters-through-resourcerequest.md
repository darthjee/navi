# Thread emit config and parameters through ResourceRequest/ResourceRequestJob

`ResourceRequest` already parses a resource's `emit` config into a `ResourceRequestEmit` instance (`this.emit`), but has no `hasEmit()` and its `enqueueExtraction()` only forwards `{ rawBody, parser }` — the parsed `emit` config and the request's `parameters` never reach `ExtractionJob`. Close that gap:

- Add `hasEmit()` on `ResourceRequest`, mirroring `hasParser()`/`hasAssets()`.
- Extend `enqueueExtraction(rawBody, jobRegistry, parameters, originUrl)` to also accept `parameters` and to include `emit: this.emit` (when `hasEmit()`) and `parameters` in the params object passed to `jobRegistry.enqueue('Extraction', ...)`.
- Update the call site in `ResourceRequestJob.#enqueueExtraction` to pass `this.#parameters` through, the same way `enqueuePaginatedActions` already does.
- A resource with only `actions` (no `parser`) must be unaffected — `hasParser()` still gates whether `enqueueExtraction` is even called, matching the "no interference" acceptance criterion.
- A resource with both `actions` and `parser`+`emit`: no change needed beyond the above — `ActionProcessingJob` and `ExtractionJob` are already independent branches off `#handleResponse`, so this "just works" once `ExtractionJob` correctly enqueues in isolation.

## Files to Change

- `source/lib/models/request/ResourceRequest.js` — `hasEmit()`, `enqueueExtraction()` signature/body changes above.
- `source/lib/jobs/ResourceRequestJob.js` — `#enqueueExtraction` call site passes `this.#parameters`.
- `source/spec/lib/models/request/ResourceRequest_spec.js` — cover `hasEmit()` and the new `enqueueExtraction()` params (emit/parameters forwarded when present, omitted when absent).
- `source/spec/lib/jobs/ResourceRequestJob_spec.js` — cover that `parameters` reach the enqueued `Extraction` job's params.
