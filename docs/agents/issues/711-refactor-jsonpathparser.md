# Issue: Refactor JsonPathParser

## Description
`JsonPathParser` (`source/lib/parsers/JsonPathParser.js`, ~90 lines) currently concentrates five responsibilities in a single class:

1. Parsing the raw response body as JSON
2. Navigating a dot-notation `match` path to resolve the target array (`#resolveMatch`)
3. Checking whether an item passes the optional `filter` conditions (`#matchesFilter`)
4. Evaluating a single filter condition against an item (`#matchesCondition`)
5. Remapping item keys via the `fields` declaration (`#mapFields`)

## Problem
This violates the Single Responsibility Principle and makes the class harder to test in isolation. The refactoring guidelines call for reducing duplication and keeping classes focused.

## Solution
Extract each private method into a dedicated class under `source/lib/parsers/json_path/`. Each extracted class receives its operating parameters through the constructor and exposes a single method that performs the work:

- **`#resolveMatch(parsedBody, match)`** → `source/lib/parsers/json_path/MatchResolver.js`
  - Constructor receives `match` (the dot-notation path string).
  - Method `resolve(parsedBody)` navigates the path against the parsed body and returns the resolved array.
  - Throws `InvalidParserMatch` when the resolved value is not an array.

- **`#matchesFilter(item, filter)`** → `source/lib/parsers/json_path/FilterMatcher.js`
  - Constructor receives `filter` (the array of conditions, or `undefined`).
  - Method `matches(item)` returns `true` when `filter` is absent; otherwise ANDs every condition, instantiating `new ConditionMatcher(condition)` internally for each one (no dependency injection, same as `JsonPathParser`).

- **`#matchesCondition(item, { field, equals, equals_field })`** → `source/lib/parsers/json_path/ConditionMatcher.js`
  - Constructor receives the condition object `{ field, equals, equals_field }`.
  - Method `matches(item)` checks a single condition: `equals_field` compares two item fields; `equals` compares a field to a literal.

- **`#mapFields(item, fields)`** → `source/lib/parsers/json_path/FieldMapper.js`
  - Constructor receives `fields` (the `{ sourceKey: outputKey }` mapping).
  - Method `map(item)` builds a new object mapping `sourceKey → outputKey`.

`JsonPathParser#extract` must be updated to instantiate the extracted classes internally (no dependency injection) and delegate to them instead of calling private methods:

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

`JsonPathParser's own JSON parsing and the `match`/`fields` presence checks stay in place — only the four extracted responsibilities move out.

Add dedicated spec files for each new class under `source/spec/lib/parsers/json_path/` (`MatchResolver_spec.js`, `FilterMatcher_spec.js`, `ConditionMatcher_spec.js`, `FieldMapper_spec.js`), covering each class's behavior in isolation. The existing `source/spec/lib/parsers/JsonPathParser_spec.js` continues to test the public `#extract` behavior end-to-end and should keep passing unchanged.

## Benefits
- Each class has a single, testable responsibility.
- Filter/condition/match/mapping logic can be unit-tested in isolation instead of only through `#extract`.
- Reduces duplication and aligns with the refactoring guidelines.
