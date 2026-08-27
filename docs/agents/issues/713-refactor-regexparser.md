# Issue: Refactor RegexParser

## Description
`RegexParser` (`source/lib/parsers/RegexParser.js`) bundles three distinct concerns inside its single `extract(rawBody, { match, field } = {})` method: validating that `match`/`field` are present, building and running the regex against the raw body, and picking the captured group vs. the full match for the output value.

This refactor extracts each concern into its own focused module under `source/lib/parsers/regex_parser/`, following the class-per-concern decomposition standard established for `CssSelectorParser` in #712: each extracted module takes its config in the **constructor** and exposes a single method that takes only the runtime data — not a single bundled `RegexParserInstance` (the original, now-superseded plan for this issue).

## Problem
Bundling validation, regex execution, and value extraction inside one method means none of them can be tested or reused in isolation, and it's inconsistent with the decomposition already applied to `JsonPathParser` (#711) and `CssSelectorParser` (#712).

## Solution
Extract the following from `RegexParser#extract`:

| Concern | Extracts to | Shape |
| --- | --- | --- |
| Validate `match`/`field` presence | `source/lib/parsers/regex_parser/AttributesValidator.js` | `new AttributesValidator({ match, field }).validate()` — throws `MissingParserMatch`/`MissingParserField` |
| Build the regex, run it against the body | `source/lib/parsers/regex_parser/PatternMatcher.js` | `new PatternMatcher(match).exec(rawBody)` — returns the exec result or `null` |
| Pick the captured group vs. the full match | `source/lib/parsers/regex_parser/MatchValueExtractor.js` | `new MatchValueExtractor().extract(result)` |

`RegexParser.extract()` becomes:

```javascript
extract(rawBody, { match, field } = {}) {
  new AttributesValidator({ match, field }).validate();

  const result = new PatternMatcher(match).exec(rawBody);
  if (!result) return [];

  return [{ [field]: new MatchValueExtractor().extract(result) }];
}
```

Public API of `RegexParser` (its `extract()` signature and return type) must not change. Existing `RegexParser` specs must pass without modification; new specs are added for each extracted module.

## Benefits
- Each concern (validation, matching, value extraction) becomes independently testable without constructing a full `RegexParser`.
- Brings `RegexParser` in line with the decomposition pattern already applied to `JsonPathParser` (#711) and `CssSelectorParser` (#712).
- No consumer-visible change: `RegexParser`'s public `extract()` signature and return type are unchanged.
