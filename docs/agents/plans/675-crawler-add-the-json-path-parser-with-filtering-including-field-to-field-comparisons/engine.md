# Engine Plan: Crawler: add the json_path parser, with filtering including field-to-field comparisons

Main plan: [plan.md](plan.md)

## Overview

Implements the `json_path` parser under `source/lib/parsers/`, registers it in the `ParserRegistry` wiring, and covers it with specs. `regex`'s parser-config exceptions are generalized so both parsers can share them where the required attribute is the same shape (`match`); a new exception is added for the plural `fields` mapping and for a `match` path that doesn't resolve to an array.

## Context

- `ExtractionJob` (added in #674) already resolves a parser implementation from `ParserRegistry` by `parser.type` and calls `parserImpl.extract(rawBody, parser.attributes)` — see `source/lib/jobs/ExtractionJob.js:58-68`.
- `ResourceRequestParser` (added in #679) already accepts `json_path` as a valid `parser.type` (`source/lib/models/request/ResourceRequestParser.js:7`) and passes every other key through unvalidated as `attributes` — validation is each parser implementation's own responsibility.
- `RegexParser` (`source/lib/parsers/RegexParser.js`) is the existing reference implementation: it receives the **raw body string**, validates required attributes eagerly (throwing `MissingParserMatch`/`MissingParserField`), and returns an array of `{ [field]: value }` items.
- Wiring lives in `source/lib/services/ApplicationInstance.js:331-332`, where `ParserRegistry` is constructed with `{ regex: new RegexParser() }` and handed to the `Extraction` job factory entry.
- The reference config (`docs/agents/future/crawler/flows.md`) documents `match`, `filter` (field-vs-literal, via `equals`), and `fields` for `json_path`, but leaves field-to-field filtering and the exact `match`-path semantics undefined — this is `docs/agents/future/crawler/gaps.md` gap #6.
- Discussion on #675 settled two open points: `match` supports dot-notation nesting (not just a flat top-level key), and a `match` that doesn't resolve to an array is a configuration error (throws), distinct from the zero-matches case (empty array within a valid list, no error).
- No new job class is introduced (unlike #674's `ExtractionJob`), so `frontend/src/constants/jobClasses.js` does not need updating — this issue only adds a new `parser.type`, not a new job.

## Steps

- [01 — Parser-config exceptions](engine/01-parser-config-exceptions.md)
- [02 — Implement JsonPathParser](engine/02-implement-json-path-parser.md)
- [03 — Register json_path in ParserRegistry wiring](engine/03-register-json-path-parser.md)
- [04 — Specs](engine/04-specs.md)
- [05 — Close gap #6 in the crawler planning docs](engine/05-update-crawler-docs.md)

## CI Checks

- `source`: `npm test` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes

- `equals_field` compares two fields **of the same item** against each other (e.g. `bnd_inid == bundle_inid`) — it is not a join across items.
- Comparison is limited to equality (`equals` / `equals_field`) for both literal and field-to-field conditions, matching the issue's acceptance criteria; no other operators (e.g. `not_equals`, `contains`) are in scope.
- No JSONPath library dependency is introduced — `match` is a simple manual dot-notation traversal (consistent with the codebase's existing preference for hand-rolled parsing over new dependencies, as seen in `RegexParser`/`HtmlParser`).
