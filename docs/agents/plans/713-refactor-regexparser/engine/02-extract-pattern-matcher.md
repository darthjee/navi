# Extract PatternMatcher

Extract the regex construction + execution into its own class. The pattern (`match`) is
constructor config; `rawBody` is the runtime data passed to the single method.

```javascript
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
```

Add a spec covering: a pattern with a capturing group matching (returns the exec result array,
capture group present at index 1), a pattern with no capturing group matching (returns the exec
result array with only index 0), and a pattern that does not match (returns `null`).

## Files to Change
- `source/lib/parsers/regex_parser/PatternMatcher.js` — new class, as above.
- `source/spec/lib/parsers/regex_parser/PatternMatcher_spec.js` — new spec.
