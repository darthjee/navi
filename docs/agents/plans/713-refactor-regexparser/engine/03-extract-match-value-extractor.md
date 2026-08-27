# Extract MatchValueExtractor

Extract the "captured group vs. full match" selection into its own class. It has no config —
the `RegExp#exec` result is the runtime data passed straight to the method.

```javascript
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
```

Add a spec covering: a result with a captured group (returns `result[1]`) and a result with no
captured group, i.e. `result.length === 1` (returns `result[0]`).

## Files to Change
- `source/lib/parsers/regex_parser/MatchValueExtractor.js` — new class, as above.
- `source/spec/lib/parsers/regex_parser/MatchValueExtractor_spec.js` — new spec.
