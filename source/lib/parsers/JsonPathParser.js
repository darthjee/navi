import { InvalidParserMatch } from '../exceptions/config/InvalidParserMatch.js';
import { MissingParserFields } from '../exceptions/config/MissingParserFields.js';
import { MissingParserMatch } from '../exceptions/config/MissingParserMatch.js';

/**
 * @typedef {object} ExtractedItem
 * A flat plain object produced by a parser's `extract()` method, mapping output field
 * names to their extracted values. Both {@link JsonPathParser#extract} and
 * {@link RegexParser#extract} produce arrays of this shape; the concrete keys present
 * are declared by the resource request's `parser` config (e.g. JsonPathParser's
 * `fields`, RegexParser's `field`) rather than fixed by this type itself. This is the
 * shape consumed by `EmitJob`'s `item` param.
 */

/**
 * JsonPathParser extracts a list of mapped items from a raw JSON response body,
 * navigating to an array via a dot-notation `match` path, optionally filtering
 * items, and remapping each item's keys according to a `fields` declaration in
 * a resource request's `parser` config.
 * @author darthjee
 */
class JsonPathParser {
  /**
   * Extracts data from the given raw JSON body using the path declared in
   * `attributes.match`, optionally filtering items via `attributes.filter`,
   * and remapping fields via `attributes.fields`.
   * @param {string} rawBody The raw response body to extract data from (parsed as JSON).
   * @param {object} attributes The parser attributes.
   * @param {string} attributes.match The dot-notation path (e.g. `data.items`) to the array
   * to extract items from, resolved against the parsed body.
   * @param {Array<object>} [attributes.filter] Optional list of AND'ed conditions an item
   * must satisfy to be included. Each condition is either `{ field, equals }` (literal
   * comparison) or `{ field, equals_field }` (field-to-field comparison, both fields read
   * from the same item).
   * @param {object} attributes.fields A `{ sourceKey: outputKey }` mapping used to build
   * each output item from the matched item's keys.
   * @returns {Array<ExtractedItem>} An array of `{ [outputKey]: value, ... }` items, one per
   * matched item that passes `filter` (or all matched items when `filter` is absent). An empty
   * array when no items match or none pass the filter.
   * @throws {MissingParserMatch} If `attributes.match` is absent.
   * @throws {MissingParserFields} If `attributes.fields` is absent.
   * @throws {InvalidParserMatch} If `attributes.match` does not resolve to an array within
   * the parsed body.
   */
  extract(rawBody, { match, filter, fields } = {}) {
    if (!match) throw new MissingParserMatch();
    if (!fields) throw new MissingParserFields();

    const parsedBody = JSON.parse(rawBody);
    const items = this.#resolveMatch(parsedBody, match);

    return items
      .filter((item) => this.#matchesFilter(item, filter))
      .map((item) => this.#mapFields(item, fields));
  }

  #resolveMatch(parsedBody, match) {
    const resolved = match.split('.').reduce((value, key) => {
      if (value === undefined || value === null) return undefined;

      return value[key];
    }, parsedBody);

    if (!Array.isArray(resolved)) throw new InvalidParserMatch(match);

    return resolved;
  }

  #matchesFilter(item, filter) {
    if (!filter) return true;

    return filter.every((condition) => this.#matchesCondition(item, condition));
  }

  #matchesCondition(item, { field, equals, equals_field: equalsField }) {
    if (equalsField !== undefined) return item[field] === item[equalsField];

    return item[field] === equals;
  }

  #mapFields(item, fields) {
    return Object.entries(fields).reduce((mapped, [sourceKey, outputKey]) => {
      mapped[outputKey] = item[sourceKey];

      return mapped;
    }, {});
  }
}

export { JsonPathParser };
