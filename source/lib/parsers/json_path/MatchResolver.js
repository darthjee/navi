import { InvalidParserMatch } from '../../exceptions/config/parser/InvalidParserMatch.js';

/**
 * MatchResolver navigates a dot-notation `match` path against a parsed JSON
 * body and resolves the array of items it points to, used by
 * {@link JsonPathParser#extract}.
 * @author darthjee
 */
class MatchResolver {
  /**
   * @param {string} [match] The dot-notation path (e.g. `data.items`) to the array
   * to resolve, evaluated against the parsed body passed to {@link MatchResolver#resolve}.
   * When absent, an empty string, or exactly `'.'`, the parsed body itself is treated
   * as the array (root-array form).
   */
  constructor(match) {
    this.match = match;
  }

  /**
   * Resolves this resolver's `match` path against the given parsed body. When
   * `match` is absent, an empty string, or exactly `'.'`, the parsed body itself
   * is returned as the array.
   * @param {object} parsedBody The parsed JSON body to navigate.
   * @returns {Array} The array resolved by navigating `match` against `parsedBody`,
   * or `parsedBody` itself for the root-array form.
   * @throws {InvalidParserMatch} If `match` does not resolve to an array within
   * `parsedBody` (a missing intermediate key, or a resolved value that isn't an array),
   * or the root-array form is used against a non-array body.
   */
  resolve(parsedBody) {
    const resolved = this.#isRootMatch()
      ? parsedBody
      : this.match.split('.').reduce((value, key) => {
        if (value === undefined || value === null) return undefined;

        return value[key];
      }, parsedBody);

    if (!Array.isArray(resolved)) {
      throw new InvalidParserMatch(this.#isRootMatch() ? '.' : this.match);
    }

    return resolved;
  }

  /**
   * @returns {boolean} `true` when `match` selects the parsed body itself (absent,
   * empty string, or exactly `'.'`).
   */
  #isRootMatch() {
    return !this.match || this.match === '.';
  }
}

export { MatchResolver };
