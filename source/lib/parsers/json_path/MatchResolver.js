import { InvalidParserMatch } from '../../exceptions/config/InvalidParserMatch.js';

/**
 * MatchResolver navigates a dot-notation `match` path against a parsed JSON
 * body and resolves the array of items it points to, used by
 * {@link JsonPathParser#extract}.
 * @author darthjee
 */
class MatchResolver {
  /**
   * @param {string} match The dot-notation path (e.g. `data.items`) to the array
   * to resolve, evaluated against the parsed body passed to {@link MatchResolver#resolve}.
   */
  constructor(match) {
    this.match = match;
  }

  /**
   * Resolves this resolver's `match` path against the given parsed body.
   * @param {object} parsedBody The parsed JSON body to navigate.
   * @returns {Array} The array resolved by navigating `match` against `parsedBody`.
   * @throws {InvalidParserMatch} If `match` does not resolve to an array within
   * `parsedBody` (a missing intermediate key, or a resolved value that isn't an array).
   */
  resolve(parsedBody) {
    const resolved = this.match.split('.').reduce((value, key) => {
      if (value === undefined || value === null) return undefined;

      return value[key];
    }, parsedBody);

    if (!Array.isArray(resolved)) throw new InvalidParserMatch(this.match);

    return resolved;
  }
}

export { MatchResolver };
