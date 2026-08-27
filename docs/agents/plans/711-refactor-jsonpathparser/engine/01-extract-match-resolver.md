# Extract MatchResolver

Create `MatchResolver`, encapsulating `JsonPathParser`'s current `#resolveMatch` private method: navigating the dot-notation `match` path against the parsed body and returning the resolved array.

The constructor receives `match` (the path string) and stores it. The public method `resolve(parsedBody)` performs the same reduce-over-`match.split('.')` navigation the current private method does, and throws `InvalidParserMatch` (imported from `../../exceptions/config/InvalidParserMatch.js`) when the resolved value is not an array.

Add a spec covering: a flat top-level match, a nested dot-notation match, a match that resolves to a non-array (throws `InvalidParserMatch`), and a match that resolves to `undefined`/missing intermediate keys (throws `InvalidParserMatch`).

## Files to Change
- `source/lib/parsers/json_path/MatchResolver.js` — new class; constructor(match), method resolve(parsedBody).
- `source/spec/lib/parsers/json_path/MatchResolver_spec.js` — new spec for the class above.
