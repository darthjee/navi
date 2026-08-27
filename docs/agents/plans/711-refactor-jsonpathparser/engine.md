# Engine Plan: Refactor JsonPathParser

Main plan: [plan.md](plan.md)

## Steps

- [01 — Extract MatchResolver](engine/01-extract-match-resolver.md)
- [02 — Extract FilterMatcher and ConditionMatcher](engine/02-extract-filter-and-condition-matcher.md)
- [03 — Extract FieldMapper](engine/03-extract-field-mapper.md)
- [04 — Update JsonPathParser to delegate](engine/04-update-json-path-parser.md)

## CI Checks
- `source`: `npm test` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes
- No dependency injection: `JsonPathParser` and `FilterMatcher` instantiate their collaborators (`MatchResolver`/`FilterMatcher`/`FieldMapper`, and `ConditionMatcher` respectively) internally.
- The existing `source/spec/lib/parsers/JsonPathParser_spec.js` must keep passing unchanged as an end-to-end test of `#extract`.
