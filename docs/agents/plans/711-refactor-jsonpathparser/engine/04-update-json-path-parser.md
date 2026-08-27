# Update JsonPathParser to delegate

Update `JsonPathParser#extract` to instantiate `MatchResolver`, `FilterMatcher`, and `FieldMapper` internally (no dependency injection) and delegate to them instead of calling the now-removed private methods:

```js
extract(rawBody, { match, filter, fields } = {}) {
  if (!match) throw new MissingParserMatch();
  if (!fields) throw new MissingParserFields();

  const parsedBody = JSON.parse(rawBody);
  const items = new MatchResolver(match).resolve(parsedBody);

  return items
    .filter((item) => new FilterMatcher(filter).matches(item))
    .map((item) => new FieldMapper(fields).map(item));
}
```

Remove the four private methods (`#resolveMatch`, `#matchesFilter`, `#matchesCondition`, `#mapFields`) from `JsonPathParser` — their logic now lives in the extracted classes. Keep the raw-body `JSON.parse` call and the `match`/`fields` presence checks (and their `MissingParserMatch`/`MissingParserFields` throws) in `JsonPathParser` itself. Drop the now-unused `InvalidParserMatch` import from `JsonPathParser.js` (it moves to `MatchResolver.js`).

Run the full `source` test suite (`npm test`) to confirm the existing `source/spec/lib/parsers/JsonPathParser_spec.js` still passes unchanged against the new delegating implementation, alongside the new specs from steps 01–03.

## Files to Change
- `source/lib/parsers/JsonPathParser.js` — remove the four private methods and their now-unused `InvalidParserMatch` import; add imports for `MatchResolver`, `FilterMatcher`, `FieldMapper`; update `#extract` to delegate as shown above.
