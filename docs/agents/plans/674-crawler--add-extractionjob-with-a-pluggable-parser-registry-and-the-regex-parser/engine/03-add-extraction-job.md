# Add ExtractionJob

New `ExtractionJob` in `source/lib/jobs/`, following the same `Job` subclass shape as `HtmlParseJob`/`ActionProcessingJob` (class-declarer file, public-before-private methods, `get arguments()` and `get maxRetries()` before `perform()`).

Constructor takes `{ id, rawBody, parser, parserRegistry, originUrl = null }`:
- `rawBody` — the raw HTTP response body.
- `parser` — the resource's `ResourceRequestParser` instance (`.type` + `.attributes`).
- `parserRegistry` — the shared `ParserRegistry` instance, injected as a fixed `JobFactory` attribute (see step 04) — not something the caller varies per enqueue.
- `originUrl` — same optional origin-tracking field `HtmlParseJob` already has.

`get maxRetries()` returns `1` — no retry rights, matching `ActionProcessingJob`/`HtmlParseJob`.

`perform(logContext)`:
1. Look up the parser implementation via `this.#parserRegistry.getItem(this.#parser.type)` (throws `ParserNotFound` for an unregistered type — caught below, same as any other extraction failure).
2. Call `parserImpl.extract(this.#rawBody, this.#parser.attributes)` to get the extracted items array.
3. Log the result via `logContext.debug(...)`, including the items array as structured metadata — this is the job's only observable side effect in this sub-issue (no persistence, no further enqueueing; emission is out of scope, see [engine.md](../engine.md) Notes).
4. On any thrown error (parser not found, or a parser-specific validation/extraction error), call `this._fail(error)`, same try/catch shape as `HtmlParseJob`.

## Files to Change

- `source/lib/jobs/ExtractionJob.js` — new.
