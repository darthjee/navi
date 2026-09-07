# emit-extracted-items.md: add parser block

`docs/guides/navi/samples/emit-extracted-items.md` crawls
`https://shop.example.com/products.json` (a bare JSON array) and emits each product to
`analytics_api`. The config has only `emit:`, and the walkthrough claims Navi "parses the
body as JSON and runs `emit` once per extracted item" — false without a `parser:`.

## What to do

1. **Configuration block** — add a `parser:` block to the `products` resource entry,
   directly above `emit:` (mirror the shape in `docs/guides/navi/emit-configuration.md`'s
   "Body Template" example and `docs/guides/navi/extraction-configuration.md`):

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
         emit:
           client: analytics_api
           method: POST
           url: /events
           status: 202
   ```

   Root-array form (`match` omitted) because the response body `[ { "id": 1, "name":
   "Widget" }, … ]` is itself the array. The near-identity `fields:` map keeps the emitted
   body identical to what the walkthrough already shows. No `filter:`.

2. **"What happens" section** — replace the sentence
   "On a `200`, it parses the body as JSON and runs `emit` once per extracted item."
   with wording that credits the parser, e.g.: "On a `200`, the `json_path` parser treats
   the response body as the array of items and, with the `fields` map, produces one item
   per array element; `emit` then forwards each item." Leave the concrete example body
   (`[ { "id": 1, "name": "Widget" }, { "id": 2, "name": "Gadget" } ]`), the two resulting
   `POST` lines, and the `emit.status` / retry / cooldown paragraph unchanged.

3. **Notes section** — add a bullet linking the parser reference alongside the existing
   `emit-configuration.md` bullet:
   `- Full \`parser.*\` field reference: [Extraction Configuration](../extraction-configuration.md).`

Do not change the `## Scenario`, the run line, or `emit.method` note.

## Files to Change

- `docs/guides/navi/samples/emit-extracted-items.md` — add `parser:` block to the config,
  rewrite the automatic-JSON-parsing sentence in "What happens", add an
  `extraction-configuration.md` link in *Notes*.
