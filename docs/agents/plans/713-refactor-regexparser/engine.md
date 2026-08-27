# Engine Plan: Refactor RegexParser

Main plan: [plan.md](plan.md)

## Steps

- [01 — Extract AttributesValidator](engine/01-extract-attributes-validator.md)
- [02 — Extract PatternMatcher](engine/02-extract-pattern-matcher.md)
- [03 — Extract MatchValueExtractor](engine/03-extract-match-value-extractor.md)
- [04 — Update RegexParser to delegate](engine/04-update-regexparser.md)

## CI Checks
- `source`: `npm test` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes
- Public API of `RegexParser` (`extract(rawBody, { match, field })` signature and `Array<ExtractedItem>` return type) must not change.
- `source/spec/lib/parsers/RegexParser_spec.js` must pass unmodified — it tests behavior, not implementation.
- Follows the exact shape adopted in #711 (`JsonPathParser`'s `json_path/` modules) and #712 (`CssSelectorParser`'s `css_selector_parser/` modules): each extracted class takes its config via the constructor and exposes a single method taking only the runtime data.
- Per #713's discussion outcome, `match`/`field` validation is extracted into its own `AttributesValidator` class rather than kept inline in `extract()` (a deliberate deviation from #712's `CssSelectorParser`, which kept its guard clauses inline).
