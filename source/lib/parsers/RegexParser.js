import { MissingParserMatch } from '../exceptions/config/MissingParserMatch.js';
import { MissingParserField } from '../exceptions/config/MissingParserField.js';

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
   * @returns {Array<object>} An array with a single `{ [field]: value }` item when the pattern
   * matches, or an empty array when it does not.
   * @throws {MissingParserMatch} If `attributes.match` is absent.
   * @throws {MissingParserField} If `attributes.field` is absent.
   */
  extract(rawBody, { match, field } = {}) {
    if (!match) throw new MissingParserMatch();
    if (!field) throw new MissingParserField();

    const regex = new RegExp(match);
    const result = regex.exec(rawBody);

    if (!result) return [];

    const value = result.length > 1 ? result[1] : result[0];

    return [{ [field]: value }];
  }
}

export { RegexParser };
