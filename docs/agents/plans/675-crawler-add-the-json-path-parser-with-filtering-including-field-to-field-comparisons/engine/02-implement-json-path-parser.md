# Implement JsonPathParser

Add `source/lib/parsers/JsonPathParser.js`, following `RegexParser`'s shape: a single `extract(rawBody, attributes)` method returning an array of mapped item objects.

Behavior:

1. Validate `attributes.match` is present (throw `MissingParserMatch` if not) and `attributes.fields` is present (throw `MissingParserFields` if not). `attributes.filter` is optional — treat an absent `filter` as "no conditions" (every item passes).
2. `JSON.parse(rawBody)` to get the parsed body (the parser owns interpreting the raw string, same responsibility split as `RegexParser` owns its own regex compilation).
3. Resolve `match` as a dot-notation path (e.g. `bundleObjs`, or `data.items`) against the parsed body, walking one key per `.`-separated segment. If any segment is missing, or the fully-resolved value is not an array, throw `InvalidParserMatch`.
4. For each item in the resolved array, evaluate `filter` as AND'ed conditions — an item passes only if every condition passes:
   - Literal condition: `{ field, equals }` — passes when `item[field] === equals`.
   - Field-to-field condition: `{ field, equals_field }` — passes when `item[field] === item[equals_field]`.
5. For each item that passes the filter, build the output object from `fields` (`{ sourceKey: outputKey }`) by mapping `{ [outputKey]: item[sourceKey] }` for every entry.
6. Return the array of mapped objects. An empty result (no items in the array, or none pass the filter) is a normal, non-throwing empty array — mirrors `RegexParser`'s no-match return.

## Files to Change

- `source/lib/parsers/JsonPathParser.js` (new) — the parser implementation described above, JSDoc'd in the same style as `RegexParser.js` (including `@throws` entries for `MissingParserMatch`, `MissingParserFields`, `InvalidParserMatch`).
