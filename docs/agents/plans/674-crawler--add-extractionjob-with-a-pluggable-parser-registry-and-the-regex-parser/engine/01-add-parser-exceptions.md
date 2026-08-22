# Add parser exceptions

Add the exception classes needed by the regex parser and the parser registry, following the existing `exceptions/config` (missing/invalid config field) and `exceptions/registry` (not-found) conventions — see `source/lib/exceptions/config/MissingEmitUrl.js` and `source/lib/exceptions/registry/ClientNotFound.js` as the direct precedents.

- `ParserNotFound` extends `ItemNotFound` (mirrors `ClientNotFound`), with `itemType: 'Parser'`, thrown by `ParserRegistry` when `getItem(type)` is called with an unregistered `type`.
- `MissingParserMatch` extends `AppError`: "Regex parser is missing the required "match" field" — thrown by `RegexParser` when `attributes.match` is absent.
- `MissingParserField` extends `AppError`: "Regex parser is missing the required "field" field" — thrown by `RegexParser` when `attributes.field` is absent.

## Files to Change

- `source/lib/exceptions/registry/ParserNotFound.js` — new, extends `ItemNotFound`.
- `source/lib/exceptions/config/MissingParserMatch.js` — new, extends `AppError`.
- `source/lib/exceptions/config/MissingParserField.js` — new, extends `AppError`.
