import { InvalidParserType } from '../../exceptions/config/InvalidParserType.js';

/**
 * The set of supported `parser.type` values.
 * @type {Array<string>}
 */
const PARSER_TYPES = ['regex', 'json_path'];

/**
 * ResourceRequestParser represents a resource request's declared response-parsing rule.
 * `type` is validated eagerly at construction time; every other key present (e.g. `match`,
 * `filter`, `fields`, `field`) is stored as-is, unvalidated, since interpreting them belongs
 * to the parser-specific implementations (`regex`, `json_path`).
 * @author darthjee
 */
class ResourceRequestParser {
  /**
   * @param {object} attributes ResourceRequestParser attributes.
   * @param {string} attributes.type The parser type. Must be one of "regex", "json_path".
   * @param {*} [attributes.rest] Any other parser-type-specific keys (e.g. `match`, `filter`,
   * `fields`, `field`), stored as-is and interpreted by the parser-specific implementations.
   */
  constructor({ type, ...rest }) {
    if (!PARSER_TYPES.includes(type)) throw new InvalidParserType(type);

    this.type = type;
    this.attributes = rest;
  }

  /**
   * Creates a ResourceRequestParser instance from a plain config object.
   * @param {object} obj Raw config object.
   * @returns {ResourceRequestParser} A new ResourceRequestParser instance.
   */
  static fromObject(obj) {
    return new ResourceRequestParser(obj);
  }
}

export { ResourceRequestParser, PARSER_TYPES };
