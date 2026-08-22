# Parser-config exceptions

`json_path` needs to signal three distinct config problems: a missing `match`, a missing `fields` mapping, and a `match` that is present but doesn't resolve to an array in the parsed body. The first can reuse `regex`'s existing exception once its message is no longer regex-specific; the other two are new.

- Generalize `MissingParserMatch`'s message from `"Regex parser is missing the required \"match\" field"` to a parser-agnostic wording (e.g. `"Parser is missing the required \"match\" field"`), so both `RegexParser` and `JsonPathParser` can throw it.
- Add `MissingParserFields`, mirroring `MissingParserField`'s shape but for the plural `fields` mapping attribute `json_path` requires (`{ sourceKey: outputKey, ... }`).
- Add `InvalidParserMatch`, thrown when `match` is present but resolving it against the parsed body does not yield an array (a key missing anywhere along the dot-notation path, or a resolved value that isn't an array). Keep this distinct from `MissingParserMatch` — one is "the config forgot the field", the other is "the config points somewhere that doesn't exist or isn't a list".

## Files to Change

- `source/lib/exceptions/config/MissingParserMatch.js` — de-specialize the message (drop "Regex parser").
- `source/lib/exceptions/config/MissingParserFields.js` (new) — mirrors `MissingParserField.js`, message referencing the required `"fields"` attribute.
- `source/lib/exceptions/config/InvalidParserMatch.js` (new) — mirrors `InvalidParserType.js`'s shape (`AppError` subclass carrying the offending `match` value in a public property), message stating the path didn't resolve to an array.
