# Wire ExtractionJob to delegate to EmitEnqueuer

Extend `ExtractionJob` so it can act on what it extracts, mirroring how `HtmlParseJob.perform()` delegates to `AssetRequestEnqueuer` after parsing.

- Constructor gains `jobRegistry`, `emit` (the resource's `ResourceRequestEmit` instance, may be absent), and `parameters` (for URL placeholder resolution downstream in `EmitJob`).
- `perform()`: after `parserImpl.extract(...)` produces `items`, if `emit` is present, delegate to `new EmitEnqueuer(items, this.#emit, this.#parameters, this.#jobRegistry).enqueue()` instead of only logging. Keep the existing debug log of the extracted items.
- When `emit` is absent (shouldn't normally happen once wired through `ResourceRequest.hasEmit()` in step 3, but keep the job itself defensive), skip enqueuing — log-only, same as today.
- Register `jobRegistry: JobRegistry` as a default attribute on the `Extraction` job factory registration, the same way `HtmlParse` already gets `jobRegistry`/`clientRegistry` injected.

## Files to Change

- `source/lib/jobs/ExtractionJob.js` — constructor + `perform()` changes above.
- `source/lib/services/ApplicationInstance.js` — `JobFactory.build('Extraction', { klass: ExtractionJob, attributes: { parserRegistry, jobRegistry: JobRegistry } })`.
- `source/spec/lib/jobs/ExtractionJob_spec.js` — cover: enqueues one `Emit` job per extracted item via `EmitEnqueuer` when `emit` is present; still only logs (no enqueue) when `emit` is absent; existing regex/json_path extraction behavior unchanged.
- `source/spec/support/factories/ExtractionJobFactory.js` (if it exists, else check nearby factories) — extend to build with the new `jobRegistry`/`emit`/`parameters` params.
