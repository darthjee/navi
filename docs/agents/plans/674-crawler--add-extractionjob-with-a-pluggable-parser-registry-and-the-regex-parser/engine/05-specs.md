# Specs

Cover every new piece plus the wiring points touched in steps 01–04, following the existing spec structure (`source/spec/lib/...` mirrors `source/lib/...`).

- `source/spec/lib/parsers/RegexParser_spec.js` — matching pattern (returns one item with the captured value under the configured `field`), non-matching pattern (returns `[]`), missing `match` (throws `MissingParserMatch`), missing `field` (throws `MissingParserField`).
- `source/spec/lib/registry/ParserRegistry_spec.js` — `getItem('regex')` returns the registered `RegexParser` instance; unregistered type throws `ParserNotFound` (mirrors `ClientRegistry_spec.js`'s shape).
- `source/spec/lib/jobs/ExtractionJob_spec.js` — matching pattern logs the extracted item(s) via `logContext.debug`; non-matching pattern logs zero items; `maxRetries` is `1`; a thrown error (e.g. unregistered parser type) calls `_fail` and does not retry.
- `source/spec/lib/models/request/ResourceRequest_spec.js` (existing file, extend) — `hasParser()` true/false; `enqueueExtraction()` enqueues `'Extraction'` with `{ rawBody, parser }` (+ `originUrl` when passed), and does nothing when `Application.isStopped()`.
- `source/spec/lib/jobs/ResourceRequestJob_spec.js` (existing file, extend) — a response for a resource with `parser` enqueues `ExtractionJob` in addition to the existing asset/action jobs; a resource without `parser` does not enqueue it.

## Files to Change

- `source/spec/lib/parsers/RegexParser_spec.js` — new.
- `source/spec/lib/registry/ParserRegistry_spec.js` — new.
- `source/spec/lib/jobs/ExtractionJob_spec.js` — new.
- `source/spec/lib/models/request/ResourceRequest_spec.js` — extend.
- `source/spec/lib/jobs/ResourceRequestJob_spec.js` — extend.
