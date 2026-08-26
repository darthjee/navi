# Add test coverage

Create `source/spec/lib/parsers/CssSelectorParser_spec.js`, following the same structure as `source/spec/lib/parsers/RegexParser_spec.js`/`JsonPathParser_spec.js` (`describe('CssSelectorParser')` > `describe('#extract')` > nested `describe`/`it` per scenario, `beforeEach` instantiating `parser = new CssSelectorParser()`).

Cover at least:

- **`match` required** — throws `MissingParserMatch` when absent (assert via `toThrowError(MissingParserMatch, 'Parser is missing the required "match" field')`, matching the exact message the existing exception already produces).
- **Fallback mode, `field` required** — when `fields` is absent and `field` is also absent, throws `MissingParserField`.
- **Fallback mode, attribute extraction** — `{ match: 'a', field: 'href', attribute: 'href' }` against HTML with one or more `<a>` tags → one item per matched `<a>`, `{ href: '...' }`.
- **Fallback mode, text extraction** — `attribute` absent → text content of each matched element, trimmed by default.
- **Multi-field mode** — `fields` map with a mix of `selector`-only (text), `selector`+`attribute`, and no-`selector` (container itself) entries, over HTML with multiple matched containers → one item per container with all fields populated.
- **`array: true`** — a field whose relative `selector` matches multiple elements within one container → array of values; zero matches → `[]` (not `null`).
- **`array` default (`false`/absent)** — first match only (`querySelector` semantics); zero matches → `null`.
- **`trim` default `true`** — leading/trailing whitespace stripped from both text and attribute values.
- **`trim: false`** — raw value preserved, whitespace included.
- **Attribute present but empty string vs. absent** — `""` stays `""`; a genuinely absent attribute yields `null`.
- **`filter` with `equals`** — a container matching the filter condition produces an item; a container that doesn't is excluded entirely from the result array. Include a multi-condition case (AND: both must pass).
- **`match` matches zero elements** — returns `[]`, no exception, no warning-dependent behavior asserted (since `extract()` takes no `logContext`).
- **Unparseable HTML** — force `node-html-parser`'s `parse()` to throw (or use an input documented to throw, if one exists in that library's test suite) → asserts `CssSelectorParser` throws `InvalidHtmlResponseBody`.

Additionally, extend `source/spec/lib/models/request/ResourceRequestParser_spec.js` with a case asserting `type: 'css'` no longer throws `InvalidParserType` (constructs successfully) — mirroring however the existing `regex`/`json_path` acceptance cases are already asserted there.

## Files to Change

- `source/spec/lib/parsers/CssSelectorParser_spec.js` (new) — full scenario coverage above.
- `source/spec/lib/models/request/ResourceRequestParser_spec.js` — add a `css` acceptance case.
