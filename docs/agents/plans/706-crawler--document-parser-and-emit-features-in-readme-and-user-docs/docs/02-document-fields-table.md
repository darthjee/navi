# Document parser/emit fields in the Configuration File Fields table

Add rows to the `### Fields` table (`README.md:176-215`), inserted after the existing `assets[].*` rows (`README.md:210-214`), following the same `parent` / `parent[].field` naming convention those rows use.

Source the exact field list and semantics from `source/lib/models/request/ResourceRequestEmit.js` (JSDoc on the constructor, `README.md:35-56` in that file) and `source/lib/parsers/CssSelectorParser.js` (JSDoc on `extract`, lines 8-46), plus `source/lib/services/builders/RegistriesBuilder.js:36-39` for the registered `type` values. Do not invent field names or defaults not present in those files.

Rows to add (values/defaults must match the source exactly — cross-check before writing):

- `parser` — Optional. Extracts structured items from the raw response body. When present, produces items independently of the resource's own `actions`/`paginated_actions` chaining.
- `parser.type` — One of `regex`, `json_path`, `css`. Selects the extraction strategy.
- `parser.match` — Meaning depends on `type`: a regex pattern (`regex`), a dot-notation path to the array to extract from, supporting nested paths like `data.items` (`json_path`), or a CSS selector for repeated container elements (`css`).
- `parser.filter` — Optional (`json_path`/`css` only). List of AND'ed conditions a matched item/container must satisfy. Each condition is `{ field/selector, attribute, trim, equals }` (literal comparison) or `{ ..., equals_field: {...} }` (field-to-field comparison against another path resolved the same way); `equals_field` wins when both are given.
- `parser.fields` — A `{ outputKey: <path or {selector, attribute, array, trim}> }` map used to build each output item (multi-field mode).
- `parser.field` / `parser.attribute` / `parser.trim` — `css` parser fallback single-field mode, used when `fields` is absent: `field` names the single output key (required), `attribute` names the HTML attribute to read (text content when absent), `trim` defaults to `true`.
- `emit` — Optional. Sends each item extracted by `parser` to an external endpoint via a dedicated `EmitJob`, one per item.
- `emit.client` — Name of the client to use, reusing the same `clients.<name>` config as `resources.<name>.client`.
- `emit.method` — One of `POST`, `PUT`, `PATCH`.
- `emit.url` — URL to emit the request to. Required.
- `emit.status` — Optional expected response status code.
- `emit.headers` — Optional map of extra HTTP headers, merged over the client's own headers (`emit.headers` wins on key collision). Values support `$VAR`/`${VAR}` resolution like `clients.<name>.headers`.
- `emit.body_template` — Optional object/array template used to re-shape the extracted item before sending it as the request body. `{:key}`/`{:nested.path}` tokens resolve against the item; `{:.}` refers to the whole item. Defaults to sending the bare item when omitted.
- `emit.retries` / `emit.cooldown` — Optional, override `EmitJob`'s default retry policy (see Step 3) for this specific emit.

## Files to Change

- `README.md` — add the rows above to the `### Fields` table, after the `assets[].*` rows.
