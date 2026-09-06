# Issue: engine: json_path parser supports a root-level array

## Description

Sub-issue of #777 (parent tracks the whole `navi-hey` crawl-and-emit demo). Owner: `engine` agent.

The `json_path` parser (`parser: { type: json_path, match: <path>, fields: {...} }`) extracts a list of items from a JSON response body: it navigates a dot-notation `match` path (`MatchResolver` does `match.split('.').reduce((v, k) => v[k], parsedBody)`) to an array, optionally filters it, and remaps each item's fields.

This issue adds one capability: letting a `json_path` config target a response whose **body is itself a bare top-level JSON array** (e.g. `[ { "slug": "books" }, { "slug": "movies" } ]`) — no wrapper key to navigate to.

The agreed signalling convention: a `json_path` parser with **`match` omitted or empty** means "the parsed body is the array"; **`match: '.'`** is accepted as an explicit, self-documenting alias for the same thing. (`$` / JSONPath root syntax is deliberately not introduced — this resolver is plain dot-notation.)

## Problem

`match` is currently **mandatory** for `json_path` and always dot-navigated:

- `source/lib/parsers/JsonPathParser.js` — `extract()` throws `MissingParserMatch` when `match` is falsy.
- `source/lib/parsers/json_path/MatchResolver.js` — `resolve()` splits `match` on `.`, reduces into `parsedBody`, and throws `InvalidParserMatch` unless the result is an array. An empty/`.` `match` resolves to `undefined` and throws.

So the parser cannot extract from a bare top-level array. Such payloads are common — the demo dev app's own `/categories.json` returns one, and the Oak endpoints the demo-config sub-issue (#780) needs `json_path` extraction against very likely do too. #780 is blocked on this.

## Expected Behavior

- `type: json_path` with `match` **omitted or empty (`''`)** extracts items from a response body that is a bare top-level JSON array. `match: '.'` behaves identically (explicit alias).
- A non-array root body in that case raises `InvalidParserMatch` (same exception as a nested path that doesn't resolve to an array).
- `fields` stays **required** (`MissingParserFields` still thrown when absent).
- `filter` (including `equals_field`) and `fields` mapping behave exactly as they do for a nested-path match, just over the root array.
- Existing nested-path `json_path` configs and their specs are unchanged in behaviour — this is purely additive.
- `regex` and `css` parsers are unaffected: each throws `MissingParserMatch` independently (`regex` via `AttributesValidator`, `css` directly), so relaxing the `json_path` guard cannot leak into them. `match` stays required for both.

## Solution

- **`MatchResolver`** (or its caller in `JsonPathParser`): when `match` is falsy or exactly `'.'`, return `parsedBody` directly instead of splitting/reducing; keep the `Array.isArray` check so a non-array root still throws `InvalidParserMatch`.
- **`JsonPathParser.extract()`**: drop the `if (!match) throw new MissingParserMatch()` guard (the root case is now valid); keep `if (!fields) throw new MissingParserFields()`.
- **`ResourceRequestParser`** (`source/lib/models/request/ResourceRequestParser.js`): no change needed — confirmed it only validates `type` and stores every other key (`match`, `filter`, `fields`, ...) as-is for the parser impl to interpret.
- **Docs**: README "Configuration File Fields" table — the `parser.match` row currently says "Required for all three"; update it to note `json_path` may omit `match` (or use `.`) to treat the whole body as the array. Update the `json_path` bullet in the "Data Extraction and Emission" prose and add/adjust a sample; mirror into `docs/guides/navi/` (`emit-configuration.md` and the samples).
- **Specs**: `source/spec/lib/parsers/json_path/MatchResolver_spec.js` and `source/spec/lib/parsers/JsonPathParser_spec.js` — add cases for `match` omitted, `''`, and `'.'` over a root array; non-array root body -> `InvalidParserMatch`; `filter` + `fields` applied to a root array.

## Benefits

- Unblocks the demo-config sub-issue (#780) — `json_path` `parser`/`emit` against Oak's list endpoints.
- Generally useful beyond the demo: many JSON APIs return a bare top-level array, and today they can't be used with `json_path` at all.
- Keeps the common (nested-path) case exactly as-is and avoids importing `$`/JSONPath semantics the dot-notation resolver doesn't otherwise support.

## Acceptance criteria

- [ ] `json_path` with `match` omitted / `''` / `'.'` extracts items from a bare top-level JSON array body.
- [ ] A non-array root body in that case raises `InvalidParserMatch`.
- [ ] `fields` still required; `filter` (incl. `equals_field`) and field mapping work identically over a root array.
- [ ] Existing nested-path `json_path` configs/specs unchanged; `regex` and `css` still require `match`.
- [ ] README fields table + "Data Extraction and Emission" prose and `docs/guides/navi/` describe the root-array form.
- [ ] `cd source && yarn coverage && yarn lint && yarn report` passes.
