# Plan: engine: json_path parser supports a root-level array

Issue: [778-engine-json-path-parser-supports-a-root-level-array.md](../issues/778-engine-json-path-parser-supports-a-root-level-array.md)

## Overview

Make the `json_path` parser able to extract from a response body that **is** a bare top-level JSON
array, not only one nested under a dot-notation `match` path. A `json_path` `parser` block with
`match` omitted/empty (or the explicit alias `match: '.'`) treats the parsed body itself as the array;
everything else about `json_path` (`fields` required, `filter`, field mapping, `InvalidParserMatch` on
a non-array) is unchanged, and `regex`/`css` are untouched. `engine` implements the behaviour and its
specs; `docs` updates the user-facing reference so the new form is discoverable. Unblocks #780.

## Agents involved

- [engine](engine.md) — the `json_path` parser behaviour and its specs, in `source/`.
- [docs](docs.md) — the `parser.match` reference in `README.md` and `docs/guides/navi/`.

## Shared contracts

The `json_path` **root-array convention** — `engine` implements exactly this, `docs` documents exactly
this:

- `parser.type: json_path` with **`match` absent or `match: ''`** → the parsed JSON response body is
  itself the array of items to extract from; no path navigation is performed.
- **`match: '.'`** is an accepted explicit alias — behaviour identical to omitting `match`.
- `fields` stays **required** for `json_path`. Omitting it still throws `MissingParserFields`
  (`"Parser is missing the required \"fields\" field"`).
- `filter` — both `{ field, equals }` (literal) and `{ field, equals_field }` (field-to-field) — and
  the `fields` `{ sourceKey: outputKey }` remap apply to the root array exactly as to a nested one.
- When the body (root case) or the `match`-resolved value (nested case) is not an array →
  `InvalidParserMatch` (unchanged; nested-path behaviour and message are not altered).
- `regex` and `css` parsers are **unchanged** — `match` stays required for both (`regex` pattern,
  `css` selector). Only `json_path` relaxes the requirement.
