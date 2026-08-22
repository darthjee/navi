# Add RegexParser and ParserRegistry

New `source/lib/parsers/` folder holding parser implementations, and a new `ParserRegistry` (`source/lib/registry/`) extending `NamedRegistry` the same way `ClientRegistry` does — mapping a `parser.type` string to a parser implementation instance, using `getItem`/`has`/`ItemNotFound` semantics even though it dispatches implementations rather than looking up plain config data (per issue discussion).

`RegexParser` exposes a single `extract(rawBody, attributes)` method:
- Validates `attributes.match` and `attributes.field` are present, throwing `MissingParserMatch`/`MissingParserField` otherwise (see step 01).
- Builds a `RegExp` from `attributes.match` and executes it against `rawBody`.
- No match → returns `[]` (empty array), not an error — this is the "non-matching pattern" acceptance criterion.
- Match → returns a single-item array: `[{ [attributes.field]: <captured group 1, or the full match if the pattern has no capturing group> }]`.

`ParserRegistry` is constructed once, in the engine wiring step (03/04), with a fixed `{ regex: new RegexParser() }` items map — it does not itself know about `json_path` or any future parser type, satisfying "the parser registry can be extended with new parser types without changing `ExtractionJob` itself".

## Files to Change

- `source/lib/parsers/RegexParser.js` — new.
- `source/lib/registry/ParserRegistry.js` — new, extends `NamedRegistry`, `static notFoundException = ParserNotFound`.
