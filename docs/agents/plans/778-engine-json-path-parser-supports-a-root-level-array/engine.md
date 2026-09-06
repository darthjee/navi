# Engine Plan: engine: json_path parser supports a root-level array

Main plan: [plan.md](plan.md)

## Shared contracts

Implement exactly the `json_path` root-array convention from `plan.md`:

- `type: json_path` with `match` absent / `''` / `'.'` → the parsed body itself is the array of items.
- `fields` stays required (`MissingParserFields` when absent).
- `filter` (literal + field-to-field) and the `fields` remap apply to the root array unchanged.
- Non-array body in the root case → `InvalidParserMatch`.
- Nested-path `json_path`, and the `regex` / `css` parsers, are unchanged — `match` still required there.

## Implementation Steps

### Step 1 — Support the root-array marker in the parser

- `source/lib/parsers/json_path/MatchResolver.js` — in `resolve(parsedBody)`, when `this.match` is
  nullish, an empty string, or exactly `'.'`, return `parsedBody` directly instead of
  `match.split('.').reduce(...)`. Keep the existing `if (!Array.isArray(resolved)) throw new
  InvalidParserMatch(this.match)` guard so a non-array root body still throws. Pass a stable value to
  `InvalidParserMatch` for the root case (e.g. normalise the marker to `'.'`) so the message reads
  `Parser "match" (".") did not resolve to an array` rather than `(undefined)`.
- `source/lib/parsers/JsonPathParser.js` — in `extract(rawBody, { match, filter, fields })`, remove
  the `if (!match) throw new MissingParserMatch()` guard (the root case is now valid). Keep
  `if (!fields) throw new MissingParserFields()`. The rest of the method is unchanged — it still
  delegates to `MatchResolver`, `FilterMatcher`, and `FieldMapper`.
- `MissingParserMatch` (`source/lib/exceptions/config/MissingParserMatch.js`) stays as-is — it is
  still thrown by `RegexParser` (via `regex_parser/AttributesValidator.js`) and `CssSelectorParser`.
  No change to `source/lib/models/request/ResourceRequestParser.js` — it only validates `type` and
  passes `match`/`filter`/`fields` through untouched.

### Step 2 — Update and extend the parser specs

- `source/spec/lib/parsers/json_path/MatchResolver_spec.js` — add `#resolve` cases: `match` omitted
  (constructed as `new MatchResolver(undefined)`), `''`, and `'.'` all return the parsed body when it
  is an array; a non-array body in that case throws `InvalidParserMatch`. Keep every existing
  nested/flat/non-array/missing-segment case unchanged.
- `source/spec/lib/parsers/JsonPathParser_spec.js` — **replace** the current
  `describe('when attributes.match is absent') { it('throws MissingParserMatch') }` block, since that
  is now the valid root-array path: assert it extracts and maps fields from a bare top-level array
  body instead. Add cases: `match: '.'` behaves identically; `filter` (literal and `equals_field`)
  applied to a root array; non-array root body throws `InvalidParserMatch`. Leave the
  `MissingParserFields` case and all nested-path cases unchanged.

## Files to Change

- `source/lib/parsers/json_path/MatchResolver.js` — return `parsedBody` for the root marker; keep the array guard.
- `source/lib/parsers/JsonPathParser.js` — drop the `MissingParserMatch` guard; keep the `fields` guard.
- `source/spec/lib/parsers/json_path/MatchResolver_spec.js` — add root-marker resolve cases.
- `source/spec/lib/parsers/JsonPathParser_spec.js` — flip the `match` absent case to root-array extraction; add `'.'`, filter, and non-array-root cases.

## CI Checks

- `source/`: `cd source && yarn coverage && yarn lint && yarn report` (CI jobs: `jasmine`, `checks`)

## Notes

- Purely additive for nested-path configs — every existing `json_path` config and spec keeps its
  behaviour. The only intentionally changed test is the `match`-absent case in `JsonPathParser_spec.js`.
- No new exception classes. `InvalidParserMatch` already covers "did not resolve to an array".
- Decide in review whether `MatchResolver` should recognise the marker itself (preferred — one place
  that turns `match` into an array) or whether `JsonPathParser` should short-circuit before
  constructing it. The step above assumes the former.
- Keep `docs`'s wording in sync with whatever marker spelling ships (`match` omitted is canonical,
  `'.'` an alias).
