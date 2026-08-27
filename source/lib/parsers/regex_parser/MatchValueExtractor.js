/**
 * MatchValueExtractor picks the captured group (or the full match, when no group
 * was captured) from a `RegExp#exec` result, used by {@link RegexParser#extract}.
 * @author darthjee
 */
class MatchValueExtractor {
  /**
   * @param {Array} result The `RegExp#exec` result.
   * @returns {string} The first captured group's value, or the full match when the
   * pattern captured no group.
   */
  extract(result) {
    return result.length > 1 ? result[1] : result[0];
  }
}

export { MatchValueExtractor };
