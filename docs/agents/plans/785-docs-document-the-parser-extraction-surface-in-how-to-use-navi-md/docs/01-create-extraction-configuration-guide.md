# Create the extraction-configuration guide

Create `docs/guides/navi/extraction-configuration.md` as a sibling of
`emit-configuration.md`, porting the reference material from `README.md:215-222` and
`README.md:475-586`.

Required content:

- **Opening paragraph** — a resource-request entry may declare a `parser:` block; it runs
  after a successful response and extracts one or more structured items from the raw body,
  independently of (in parallel with) `actions` / `paginated_actions` chaining. State
  plainly that a `parser:` block is **required** — with no `parser:`, nothing is extracted
  and `emit:` does nothing.
- **`### Fields` table** — one row each for `parser.type`, `parser.match`, `parser.filter`,
  `parser.fields`, `parser.field`, `parser.attribute`, `parser.trim`, with the per-`type`
  meaning taken verbatim in substance from `README.md:216-222`. Also mention the top-level
  `extraction.size` key here or cross-reference step 02.
- **Parser types** — a short subsection per `regex`, `json_path`, `css` describing what each
  strategy does (adapted from `README.md:479-483`).
- **`json_path` root-array form** — explicitly document that omitting `match` (or
  `match: ''` / `match: '.'`) treats the whole response body as the array of items;
  `fields` stays required, `filter` still applies, and a non-array body raises the same
  "did not resolve to an array" error as a bad nested path (`README.md:526`). `regex` and
  `css` still require `match`.
- **At least one worked `parser:` + `emit:` YAML block** — use
  `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` (the `json_path` +
  `filter` + `fields` case) as the reference shape; the README's `loot_catalog` example
  (`README.md:491-524`) is the same flow and can be adapted. Show the resulting extracted
  item shape and what `emit` sends per item.
- **Cross-links** — a `[← Back to How to Use Navi](../how_to_use_navi.md)` footer link and a
  link across to [Emit Configuration](emit-configuration.md), matching the footer style of
  the other `docs/guides/navi/*.md` pages.

## Files to Change

- `docs/guides/navi/extraction-configuration.md` — new file; the extraction/`parser:`
  reference page.
