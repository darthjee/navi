## Context

Builds on the `parser` config from the config-schema sub-issue of #671. Introduces the extraction step of the crawler pipeline: a new `ExtractionJob` that reads a resource's configured parser, uses it against the raw response body, and produces a list of structured items. This sub-issue ships the job shell plus the simplest built-in parser (`regex`) so the pipeline is functional end-to-end for the regex case.

## What needs to be done

- New `ExtractionJob` in `source/lib/jobs/`, following the existing `Job` subclass conventions used by `ActionProcessingJob`/`HtmlParseJob` (class-declarer file, public-before-private methods).
- `ExtractionJob` has no retry rights — exhausted on first failure, same as `ActionProcessingJob`/`HtmlParseJob`.
- A small parser registry (`source/lib/registry/`), extending `NamedRegistry`, that maps a `parser.type` string to a parser implementation instance — reusing `getItem`/`has`/`ItemNotFound` semantics the way `ClientRegistry` does, even though it's dispatching implementations rather than looking up plain data.
- Built-in **regex** parser: applied directly on the raw response body (standalone, not layered on another parser's output); returns one item with the captured group(s) mapped to the configured `field` name.
  - Validates its own config eagerly (`match`, `field` present and well-formed), throwing a clear config error on malformed/missing values — consistent with how `ResourceRequestParser` already validates `type` via `InvalidParserType`.
- `ExtractionJob`'s only observable side effect in this sub-issue is logging the extracted items (via the existing `LogRegistry`) — no persistence, no enqueueing of further jobs. Emission (`EmitJob`) is explicitly out of scope here; it's covered by the end-to-end wiring sub-issue.
- Wire `ExtractionJob` to be enqueued after a response is received, in parallel with `ActionProcessingJob`/`HtmlParseJob`, only when the resource declares a `parser` — mirroring the existing `hasAssets()`/`enqueueAssets()` pattern on `ResourceRequest`/`ResourceRequestJob` (`hasParser()`/`enqueueExtraction()`).
- Register the new parser registry/job with whatever central registry wiring existing job types use (`ApplicationInstance#initRegistries`, see how `HtmlParseJob` is wired via `JobFactory.build('HtmlParse', ...)` for precedent).
- Specs under `source/spec/lib/jobs/` for `ExtractionJob` and the regex parser.

## Acceptance criteria

- [ ] A resource with `parser: { type: regex, match: <pattern>, field: <name> }` produces one extracted item with the captured value, logged by `ExtractionJob`
- [ ] `ExtractionJob` is only enqueued for resources that declare a `parser`
- [ ] `ExtractionJob` does not retry on failure
- [ ] The parser registry can be extended with new parser types without changing `ExtractionJob` itself
- [ ] The regex parser raises a clear config error when `match` or `field` is missing/malformed
- [ ] Specs cover a matching pattern, a non-matching pattern, malformed `match`/`field` config, and a resource without a `parser`

## Related

Part of #671. Depends on the config-schema sub-issue (`parser`/`emit` YAML support). The `json_path` parser sub-issue and the end-to-end wiring sub-issue build on this.
