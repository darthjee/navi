# Fix emit-configuration.md

Three edits to `docs/guides/navi/emit-configuration.md`.

1. **Opening sentence** (`emit-configuration.md:3`) — it currently reads as though items are
   extracted on their own. Reword so it states that `emit` sends onward the items produced
   by the resource's `parser`; it is **not** automatic and does nothing without a `parser:`
   block. Keep the rest of the sentence's content (the "instead of / in addition to
   `actions` / `paginated_actions`" framing, the "lives under a resource entry's `emit:`
   key" note).

2. **Cross-link** — add a link to the new
   [Extraction Configuration](extraction-configuration.md) page, near the opening paragraph
   and/or in the closing footer line alongside the existing "Related sample" links.

3. **Make the worked Example valid** (`emit-configuration.md:31-44`) — the example declares
   `emit:` with no `parser:`, which is an invalid config. Prefix the existing `emit:` block
   with a minimal `parser:` block that produces the `{ "id": 1, "name": "Widget" }` item the
   surrounding prose already assumes. Simplest form (also exercises the `json_path`
   root-array behaviour):

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
           body_template:
             event: item.extracted
             data: "{:.}"
   ```

   Leave the `body_template` narrative, the input item, and the rendered JSON output below
   the example unchanged — only the YAML block gains the `parser:` lines.

## Files to Change

- `docs/guides/navi/emit-configuration.md` — reword the opening sentence, add the
  extraction-configuration cross-link, and add a `parser:` block to the worked Example.
