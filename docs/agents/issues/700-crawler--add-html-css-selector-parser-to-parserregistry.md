# Issue: Crawler: add HTML/CSS selector parser to ParserRegistry

## Description

Part of #699 (Next Steps for Crawler Implementation).

The Information Crawling & Data Emission feature extracts structured data from HTTP responses via configurable parsers (see `docs/agents/future/crawler.md` and `docs/agents/future/crawler/overview.md`). The parser registry currently supports `regex` (#674) and `json_path` (#675) parsers, registered in `ParserRegistry` (`source/lib/registry/ParserRegistry.js`) and wired up in `source/lib/services/ApplicationInstance.js`.

Implement a third parser type, `css`, that accepts a CSS selector (and, per field, an optional attribute) and produces `ExtractedItem`s from matched HTML elements, following the same `Parser` interface (`extract(rawBody, attributes) → Array`) as `RegexParser` and `JsonPathParser`.

## Problem

Many crawling use cases involve HTML responses where CSS selectors are the natural extraction method (e.g. scraping a listing page's product cards, links, or titles). Today, extracting structured data from HTML would require awkwardly reusing `regex` (fragile against markup variation) or `json_path` (inapplicable to HTML bodies) — there is no first-class way to select repeated elements by CSS selector and map their attributes/text into `ExtractedItem`s.

`source/lib/utils/HtmlParser.js`/`HtmlElementParser.js` already do CSS-selector-based extraction, but for a different scope: they're used by `AssetRequestEnqueuer` (`source/lib/enqueuers/AssetRequestEnqueuer.js`) for asset-download link discovery, not crawler data extraction — and their interface (`parse(rawHtml, selector, attribute, logContext)`, requiring a `logContext` for warning logs) doesn't fit `Parser#extract(rawBody, attributes)`, which receives no `logContext`. Confusing or merging the two would conflate asset fetching with information crawling, which are conceptually separate features even though they share selector-matching mechanics.

## Expected Behavior

**Config shape** — following `RegexParser`'s `{ match, field }` and `JsonPathParser`'s `{ match, filter, fields }` patterns:

- `attributes.match` (required) — a CSS selector for the repeated container elements. One output item is produced per matched element (mirrors `json_path`'s array-of-items model). Throws `MissingParserMatch` when absent, same exception `RegexParser`/`JsonPathParser` already throw.
- `attributes.fields` (optional) — a `{ outputKey: { selector, attribute, array, trim } }` map. For each matched container element, each field's `selector` runs relative to that container (absent/empty `selector` means the container element itself); `attribute` is optional — when given, extracts that attribute's value, when absent, extracts the element's text content.
- When `attributes.fields` is absent, fall back to a single-field mode mirroring `RegexParser`: `attributes.field` (required in this mode — throws `MissingParserField`, reusing the exception `RegexParser` already throws) names the single output key, and `attributes.attribute`/`attributes.trim` (optional) are read directly off each matched container element (no relative sub-selector in this mode; no `array` option — see below).

**`array` option** (multi-field mode only) — a field's relative `selector` may match multiple elements within one container. By default (`array` absent/`false`) the first match is used (`querySelector` semantics), value `null` when nothing matches. With `array: true`, all matches are collected (`querySelectorAll` semantics) into an array, empty (`[]`, not `null`) when nothing matches. `array` doesn't extend to fallback mode, where `match` already selects containers directly and there's no relative sub-selector to collect multiple values from.

**`filter` option** (both modes) — mirrors `json_path`'s `filter`: an array of AND'ed conditions evaluated per matched container, applied **before** `fields`/fallback field mapping (same ordering as `json_path`). A container failing any condition is skipped entirely (no output item produced for it). Each condition is `{ selector, attribute, trim, equals }` — `selector`/`attribute`/`trim` resolve a value relative to the container using the same rules as a `fields` entry (absent `selector` = the container itself, absent `attribute` = text content, `trim` defaults to `true`), compared for strict equality against `equals`. Only literal `equals` comparisons are supported in this issue; `json_path`'s field-to-field `equals_field` comparator is deferred to #707 since it would require two independent selector resolutions per condition instead of one.

Example:
```js
{
  match: '.product',
  filter: [{ selector: '.stock', attribute: 'data-available', equals: 'true' }],
  fields: { title: { selector: 'h2' }, link: { selector: 'a', attribute: 'href' } }
}
// only .product containers whose .stock[data-available] === 'true' produce an item
```

**`trim` option** (both modes, text and attribute values alike, default `true`) — text-content and attribute-value extraction both trim whitespace by default; opt out per field with `trim: false`. When combined with `array: true`, `trim` applies independently to each collected value.

Example:

```html
<div class="product">
  <h2>  Widget  </h2>
  <span class="tag">  new  </span>
  <span class="tag">  sale  </span>
  <a href="/widget">  Buy  </a>
</div>
```

```js
{
  match: '.product',
  fields: {
    title: { selector: 'h2' },                          // trim default -> "Widget"
    tags:  { selector: '.tag', array: true },            // each collected value trimmed independently -> ["new", "sale"]
    link:  { selector: 'a', attribute: 'href' },         // attribute, trim applies too -> "/widget"
    raw:   { selector: 'a', array: true, trim: false }   // array + no trim -> ["  Buy  "]
  }
}
// -> [{ title: "Widget", tags: ["new", "sale"], link: "/widget", raw: ["  Buy  "] }]
```

Fallback single-field mode:

```js
{ match: 'a', field: 'href', attribute: 'href' } // -> [{ href: '...' }, ...]
{ match: 'h2', field: 'title' }                  // attribute absent -> text content
```

**Edge cases:**

- Unparseable HTML — if `node-html-parser`'s `parse()` throws, reuse `InvalidHtmlResponseBody` (`source/lib/exceptions/request/InvalidHtmlResponseBody.js`), already generic and not scoped to the asset-discovery feature.
- Attribute present but empty string (`""`) vs. attribute absent — two distinct outcomes: `""` (found, empty) vs. `null` (not found).
- `match` selector matches zero container elements → return `[]` (silent, like `RegexParser` on no match — no warning logs, since `extract()` has no `logContext`).
- A field's `selector`/`attribute` finds nothing within a matched container → that field's value is `null` in the output item (the item itself is still produced).

## Solution

- New class `CssSelectorParser` in `source/lib/parsers/`, alongside `RegexParser`/`JsonPathParser` — distinct from, and not reusing, `HtmlElementParser`'s `getAttribute` (which depends on a `logContext` `extract()` doesn't receive). The `node-html-parser` npm dependency itself (`parse()`/`querySelectorAll()`/`querySelector()`) is reusable — it's already a `source/package.json` dependency (`7.1.0`, used by the existing `HtmlParser.js`) — no new package needed.
- Register it in `ParserRegistry` under key `css` (naming follows `regex`/`json_path`'s pattern of naming the extraction mechanism, not the body format), wired up in `source/lib/services/ApplicationInstance.js` alongside the other two.
- Update `source/lib/models/request/ResourceRequestParser.js`: add `css` to the `PARSER_TYPES` const and to `InvalidParserType`'s hardcoded message (currently lists `"regex", "json_path"`) — purely additive, existing `regex`/`json_path` validation paths unaffected.
- `HtmlParser.js`/`HtmlElementParser.js` stay untouched — no risk to existing asset-discovery behavior.

**Performance & security:** no existing response-size or match-count limit exists anywhere in the parser layer today (`regex`/`json_path` don't bound it either), so this isn't a new gap. `node-html-parser`'s parse cost and per-field `querySelector`/`querySelectorAll` calls (`O(elements x fields)`) are the same order of work as `JsonPathParser`'s per-item field mapping. `match`/`fields` selectors come from admin-authored config (not the untrusted response body), same trust boundary as `RegexParser`'s regex and `JsonPathParser`'s `match`/`filter`, and CSS selectors don't carry regex's ReDoS risk.

Suggested owner: `engine` specialist.

## Benefits

- Enables first-class, ergonomic extraction from HTML responses (the common case for crawling listing/detail pages), without abusing `regex` or `json_path` for a format they don't fit.
- Fully additive: no changes to `regex`/`json_path` behavior, no new dependency, and `HtmlParser.js`/`HtmlElementParser.js` (asset discovery) remain untouched.
- Follows the exact `Parser` interface and config-shape conventions already established by `RegexParser`/`JsonPathParser`, keeping the parser registry consistent and predictable for future parser types.
