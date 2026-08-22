# Wire ExtractionJob into the request pipeline

Mirror the existing `hasAssets()`/`enqueueAssets()` pattern (`source/lib/models/request/ResourceRequest.js`) and its call site in `ResourceRequestJob#handleResponse` (`source/lib/jobs/ResourceRequestJob.js`), so `ExtractionJob` is enqueued in parallel with `ActionProcessingJob`/`HtmlParseJob` — only when the resource declares a `parser`.

`ResourceRequest`:
- `hasParser()` — returns `!!this.parser` (analogous to `hasAssets()`).
- `enqueueExtraction(rawBody, jobRegistry = DefaultJobRegistry, originUrl = null)` — analogous to `enqueueAssets`, but does **not** take a `parserRegistry` param: `parserRegistry` is injected once as a fixed `JobFactory` attribute (see the `ApplicationInstance` change below), not threaded per-request the way `clientRegistry` is for `HtmlParse` — it never varies between resources. Builds `params = { rawBody, parser: this.parser }` (+ `originUrl` when set) and calls `jobRegistry.enqueue('Extraction', params)`.

`ResourceRequestJob#handleResponse`:
- Add `this.#enqueueExtraction(response, originUrl);` alongside the existing `this.#enqueueAssets(response, originUrl);` call.
- New private `#enqueueExtraction(response, originUrl)`: `if (this.#resourceRequest.hasParser()) this.#resourceRequest.enqueueExtraction(response.data, JobRegistry, originUrl);` — no constructor changes needed on `ResourceRequestJob` itself, since it doesn't need to hold `parserRegistry`.

`ApplicationInstance#initRegistries`:
- Import `ExtractionJob`, `ParserRegistry`, `RegexParser`.
- Build the registry once: `const parserRegistry = new ParserRegistry({ regex: new RegexParser() });`
- Register the job factory: `JobFactory.build('Extraction', { klass: ExtractionJob, attributes: { parserRegistry } });` — placed alongside the existing `JobFactory.build('HtmlParse', ...)`/`JobFactory.build('AssetDownload', ...)` calls.

## Files to Change

- `source/lib/models/request/ResourceRequest.js` — add `hasParser()`, `enqueueExtraction()`.
- `source/lib/jobs/ResourceRequestJob.js` — add `#enqueueExtraction()` call and method.
- `source/lib/services/ApplicationInstance.js` — build `ParserRegistry`, register `'Extraction'` job factory.
