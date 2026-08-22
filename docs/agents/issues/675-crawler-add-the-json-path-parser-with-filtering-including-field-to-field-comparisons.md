# Issue: Crawler: add the json_path parser, with filtering including field-to-field comparisons

## Description

Adds the `json_path` parser — the second built-in parser for the `ExtractionJob` + `ParserRegistry` introduced in #674 (part of #671). It navigates a parsed JSON response body, filters a list of items using AND'ed conditions, and maps selected fields to output field names. This is the parser for the reference crawler use case (Loot Studios catalog extraction, documented in `docs/agents/future/crawler/flows.md`), which requires filtering miniatures both by a literal (`obj_type == "miniature"`) and by comparing two fields of the same item against each other (`bnd_inid == bundle_inid`) — the field-to-field comparison gap explicitly left open in #671's gap analysis (`docs/agents/future/crawler/gaps.md`, gap #6).

## Solution

- Add a `json_path` parser class (`source/lib/parsers/JsonPathParser.js`), registered under the `json_path` key in `ParserRegistry` — already anticipated as a valid `parser.type` value in `ResourceRequestParser`'s `PARSER_TYPES` (#679).
- Parser attributes:
  - `match`: a dot-notation path into the parsed JSON body pointing at the list of items to extract (e.g. `bundleObjs`, or a nested path like `data.items`).
  - `filter` (optional): a list of AND'ed conditions, each either:
    - field-vs-literal — `field: obj_type, equals: miniature` (already documented in `flows.md`)
    - field-vs-field (new) — `field: bnd_inid, equals_field: bundle_inid`
  - `fields`: maps source JSON keys to output field names.
- Validate required attributes eagerly, raising dedicated exceptions for a missing `match` or missing `fields`, mirroring `MissingParserMatch`/`MissingParserField` from the `regex` parser.
- When `match` is present but does not resolve to an array in the parsed body (missing key anywhere along the dot-notation path, or the resolved value is not an array), raise a dedicated config error (distinct from the "missing `match`" case) — a bad `match` path is a configuration bug, not a zero-matches result.
- Well-defined, non-throwing behavior for zero matches *within* a valid array (filter excludes everything): an empty item list, no error.
- Specs covering: literal filters, field-to-field filters, filters combining both, nested `match` paths, zero matches, and malformed `match` paths (missing key, non-array value).

## Acceptance criteria

- [ ] `json_path` parser extracts and maps fields from a list found at `match` (supporting dot-notation nested paths) in the parsed JSON body
- [ ] `filter` supports multiple AND'ed conditions
- [ ] `filter` supports at least one condition comparing two fields of the same item against each other, not just field-vs-literal
- [ ] Behavior with zero matches (empty/filtered-out array) is well-defined: empty item list, no error
- [ ] A `match` path that does not resolve to an array raises a dedicated config error, distinct from zero matches
- [ ] Specs cover literal filters, field-to-field filters, their combination, nested match paths, and malformed match paths — matching the Loot Studios example in `docs/agents/future/crawler/flows.md`

## Related

Part of #671. Depends on #674 (`ExtractionJob` + parser registry + regex parser). Resolves the field-to-field filter gap called out in #671 (`docs/agents/future/crawler/gaps.md`, gap #6).
