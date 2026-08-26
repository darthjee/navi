# Implement CssSelectorParser

Create `CssSelectorParser` in `source/lib/parsers/`, following the same shape/doc-comment conventions as `RegexParser`/`JsonPathParser` (a `@typedef ExtractedItem` reference already lives at the top of `JsonPathParser.js` — do not redeclare it, just reference it in JSDoc).

`extract(rawBody, { match, filter, fields, field, attribute, trim } = {})`:

1. **Validate `match`** — throw `MissingParserMatch` (from `../exceptions/config/MissingParserMatch.js`) if absent, same as `RegexParser`/`JsonPathParser`.
2. **Parse `rawBody`** — `import { parse } from 'node-html-parser'`; wrap the call in try/catch and throw `InvalidHtmlResponseBody` (`../exceptions/request/InvalidHtmlResponseBody.js`) on failure, mirroring `HtmlParser.js`'s existing try/catch (`source/lib/utils/HtmlParser.js:26-30`) — but note `InvalidHtmlResponseBody`'s constructor takes `(raw, cause)`, no `logContext` involved.
3. **Select containers** — `root.querySelectorAll(match)`. If empty, return `[]` immediately (silent — no warning logs, `extract()` receives no `logContext`).
4. **Validate fallback mode's `field`** — only when `fields` is absent: throw `MissingParserField` (`../exceptions/config/MissingParserField.js`) if `field` is also absent.
5. **Per matched container**, in order:
   a. If `filter` is present, evaluate every condition (AND) via a private `#resolveValue(element, { selector, attribute, trim })` helper (see below) — `equals` compared with strict `===` against the resolved value (which may be `null`, `""`, or text/attribute content, all strings or `null`). Skip the container entirely (produce no item) if any condition fails.
   b. If `fields` is present (multi-field mode): build the output item as `Object.entries(fields).reduce(...)`, resolving each field via `#resolveValue` (default) or `#resolveArrayValue` when `field.array === true`.
   c. Else (fallback mode): `{ [field]: this.#resolveValue(container, { attribute, trim }) }` — no relative `selector`, resolved directly against the container.
6. Return the array of items (containers filtered out in step 5a contribute no entry).

**`#resolveValue(element, { selector, attribute, trim = true } = {})`** — private method:
- `target = selector ? element.querySelector(selector) : element`
- Return `null` if `target` is falsy (selector didn't match).
- `raw = attribute !== undefined ? target.getAttribute(attribute) : target.text` — `getAttribute` returns `undefined` when absent; normalize to `null` in that case (per the issue's "attribute absent → `null`" rule; "attribute present but empty string" stays `""`).
- Apply `trim` (default `true`) via `.trim()` on non-null string results only, skip when `trim === false`.

**`#resolveArrayValue(element, { selector, attribute, trim = true } = {})`** — multi-field mode only, used when a field sets `array: true`:
- If `selector` is present: `element.querySelectorAll(selector)`, map each match through the same attribute/text + trim logic as `#resolveValue` (factor out a shared value-extraction helper to avoid duplicating the attribute/text/trim logic between the two methods).
- If `selector` is absent, treat the container itself as the sole candidate: return `[value]` if resolvable, `[]` otherwise (there's only ever one "container itself").
- Empty result is `[]`, never `null` — an array is always expected when `array: true`.

## Files to Change

- `source/lib/parsers/CssSelectorParser.js` (new) — the class described above.
