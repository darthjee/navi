/**
 * PatternMatcher builds a regular expression from a `match` pattern and runs it
 * against a raw body, used by {@link RegexParser#extract}.
 * @author darthjee
 */
class PatternMatcher {
  /**
   * @param {string} match The regular expression pattern.
   */
  constructor(match) {
    this.match = match;
  }

  /**
   * Executes the pattern against the given raw body.
   * @param {string} rawBody The raw body to match against.
   * @returns {Array|null} The `RegExp#exec` result (with a possible capture group at index 1),
   * or `null` when the pattern does not match.
   */
  exec(rawBody) {
    const regex = new RegExp(this.match);

    return regex.exec(rawBody);
  }
}

export { PatternMatcher };
