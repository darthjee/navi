# Extract AttributesValidator

Extract `RegexParser`'s `match`/`field` presence validation into its own class. It takes the raw
`{ match, field }` attributes in the constructor and exposes a no-argument `validate()` method
(there is no separate runtime input beyond the config itself — validating the config *is* the
whole job), throwing the same exceptions `RegexParser` throws today.

```javascript
import { MissingParserField } from '../../exceptions/config/MissingParserField.js';
import { MissingParserMatch } from '../../exceptions/config/MissingParserMatch.js';

/**
 * AttributesValidator validates the `match`/`field` attributes required by
 * {@link RegexParser#extract}.
 * @author darthjee
 */
class AttributesValidator {
  /**
   * @param {object} attributes The parser attributes to validate.
   * @param {string} attributes.match The regular expression pattern.
   * @param {string} attributes.field The output field name.
   */
  constructor({ match, field }) {
    this.match = match;
    this.field = field;
  }

  /**
   * Validates the attributes, throwing when a required field is missing.
   * @throws {MissingParserMatch} If `match` is absent.
   * @throws {MissingParserField} If `field` is absent.
   */
  validate() {
    if (!this.match) throw new MissingParserMatch();
    if (!this.field) throw new MissingParserField();
  }
}

export { AttributesValidator };
```

Add a spec covering: both fields present (no throw), `match` absent (throws `MissingParserMatch`
with the existing message), `field` absent (throws `MissingParserField` with the existing message)
— port the exact expectations from the corresponding cases in `RegexParser_spec.js`.

## Files to Change
- `source/lib/parsers/regex_parser/AttributesValidator.js` — new class, as above.
- `source/spec/lib/parsers/regex_parser/AttributesValidator_spec.js` — new spec.
