# emit-body-template.md: add parser block

`docs/guides/navi/samples/emit-body-template.md` is the same crawl as recipe 01 but with an
`emit.body_template` that references `{:id}`, `{:address.city}`, and `{:.}` on each item.
The config has only `emit:`; the walkthrough says Navi "crawls `/products.json` and runs
`emit` once per array item" with no parser.

## What to do

1. **Configuration block** — add a `parser:` block above `emit:` on the `products`
   resource. The `fields:` map **must** produce every key the `body_template` tokens
   resolve against — `id`, `name`, and the nested `address` object (for
   `{:address.city}`):

   ```yaml
   resources:
     products:
       - url: /products.json
         status: 200
         parser:
           type: json_path
           # match omitted — the whole response body is the array of items
           fields:
             id: id
             name: name
             address: address
         emit:
           client: analytics_api
           method: POST
           url: /events
           status: 202
           body_template:
             event: item.extracted
             product_id: "{:id}"
             city: "{:address.city}"
             note: "product {:id} extracted"
             data: "{:.}"
   ```

   `address: address` copies the whole nested `address` object through unchanged —
   confirmed in `source/lib/parsers/json_path/FieldMapper.js` (`mapped[outputKey] =
   item[sourceKey]`, a plain reference copy). Note `fields:` source keys are flat lookups,
   not dot-paths, so `address.city: …` would **not** work — the whole-object copy is the
   only way to keep `{:address.city}` resolvable on the emitted item.

2. **"What happens" section** — replace "Navi crawls `/products.json` and runs `emit` once
   per array item, building the body from `body_template` each time." with a version that
   names the parser: e.g. "The `json_path` parser treats the response body as the array of
   items and maps `id`, `name`, and `address` into each one; `emit` then runs once per
   item, building the body from `body_template`." Leave the concrete item
   (`{ "id": 1, "name": "Widget", "address": { "city": "Berlin" } }`), the rendered JSON
   output, the entire "Token rules" list, and the trailing `emit.status` paragraph
   unchanged.

3. **Notes section** — add a bullet:
   `- Full \`parser.*\` field reference: [Extraction Configuration](../extraction-configuration.md).`
   next to the existing `emit-configuration.md` bullet. Keep the "Without `body_template`,
   the bare item is sent as-is." bullet.

Do not change `## Scenario` or the run line.

## Files to Change

- `docs/guides/navi/samples/emit-body-template.md` — add `parser:` block (with
  `fields: { id, name, address }`), rewrite the no-parser sentence in "What happens", add
  an `extraction-configuration.md` link in *Notes*.
