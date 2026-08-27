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
