# Specs

Cover `JsonPathParser` per the issue's acceptance criteria, and update the one existing spec whose expectation changes as a side effect of step 01's message de-specialization.

`JsonPathParser_spec.js` cases:
- Extracts and maps fields from a flat top-level `match` key (the Loot Studios example from `docs/agents/future/crawler/flows.md`: `bundleObjs` → `inid`/`name`/`post_id`/`bundle`).
- Extracts from a nested dot-notation `match` path (e.g. `data.items`).
- `filter` with a single literal condition (`equals`).
- `filter` with a single field-to-field condition (`equals_field`).
- `filter` combining a literal and a field-to-field condition (AND'ed) — mirrors the Loot Studios `obj_type == "miniature" AND bnd_inid == bundle_inid` case.
- No `filter` present — every item passes through.
- Zero matches: `match` resolves to an empty array, or `filter` excludes every item — both return `[]` with no error.
- Missing `match` attribute — throws `MissingParserMatch`.
- Missing `fields` attribute — throws `MissingParserFields`.
- Malformed `match`: a path segment missing from the parsed body, and a `match` that resolves to a non-array value — both throw `InvalidParserMatch`.

## Files to Change

- `source/spec/lib/parsers/JsonPathParser_spec.js` (new) — cases above, following `RegexParser_spec.js`'s structure.
- `source/spec/lib/parsers/RegexParser_spec.js` — update the `MissingParserMatch` message expectation to match the de-specialized wording from step 01.
