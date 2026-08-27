# Update RegexParser to delegate

Rewrite `RegexParser#extract` to delegate to the three modules extracted in steps 01–03, dropping
the inline validation, regex construction, and value-selection logic (and the now-unused
`MissingParserField`/`MissingParserMatch` imports, which move to `AttributesValidator`).

```javascript
import { AttributesValidator } from './regex_parser/AttributesValidator.js';
import { MatchValueExtractor } from './regex_parser/MatchValueExtractor.js';
import { PatternMatcher } from './regex_parser/PatternMatcher.js';

/**
 * RegexParser extracts a single field from a raw response body using a regular
 * expression declared in a resource request's `parser` config.
 * @author darthjee
 */
class RegexParser {
  /**
   * Extracts data from the given raw body using the regex declared in `attributes.match`.
   * @param {string} rawBody The raw response body to extract data from.
   * @param {object} attributes The parser attributes.
   * @param {string} attributes.match The regular expression pattern to match against `rawBody`.
   * @param {string} attributes.field The name of the field to populate with the captured value.
   * @returns {Array<ExtractedItem>} An array with a single `{ [field]: value }` item when the
   * pattern matches, or an empty array when it does not.
   * @throws {MissingParserMatch} If `attributes.match` is absent.
   * @throws {MissingParserField} If `attributes.field` is absent.
   */
  extract(rawBody, { match, field } = {}) {
    new AttributesValidator({ match, field }).validate();

    const result = new PatternMatcher(match).exec(rawBody);

    if (!result) return [];

    return [{ [field]: new MatchValueExtractor().extract(result) }];
  }
}

export { RegexParser };
```

Keep the class-level and method-level JSDoc as they are today (shown above) — only the method
body changes. `source/spec/lib/parsers/RegexParser_spec.js` must pass without any modification,
since `extract()`'s signature, thrown exceptions, and return values are unchanged.

## Files to Change
- `source/lib/parsers/RegexParser.js` — delegate to `AttributesValidator`, `PatternMatcher`, and `MatchValueExtractor`; drop the now-unused `MissingParserField`/`MissingParserMatch` imports.
