# paginated-crawl-emit.md: add parser block

`docs/guides/navi/samples/paginated-crawl-emit.md` combines `paginated_actions` on a
`listing` resource with `emit:` on the per-page `items_page` resource. Each page returns a
bare JSON array (`[ { "id": 1 }, { "id": 2 } ]`). The `items_page` entry has only `emit:`,
and the walkthrough says "extraction + `emit` runs *per page*" without any parser present.

## What to do

1. **Configuration block** — add a `parser:` block to the **`items_page`** resource entry
   (not `listing`), directly above its `emit:`:

   ```yaml
     items_page:
       - url: /items.json?page={:page}
         status: 200
         parser:
           type: json_path
           # match omitted — each page's body is itself the array of items
           fields:
             id: id
         emit:
           client: sink_api
           method: POST
           url: /sink
           status: 202
   ```

   Root-array form; near-identity `fields: { id: id }` keeps the emitted body
   (`{ "id": 1 }`) identical to the walkthrough. Leave the `listing` resource and its
   `paginated_actions` block untouched.

2. **"What happens" section** — keep the pagination walkthrough (the `pages: 3`
   resolution, the three `items_page` job URLs) as-is. Rewrite the composition sentence
   "`paginated_actions` and `emit` compose: the page fan-out happens first, then
   extraction + `emit` runs *per page*." to name the parser explicitly, e.g.:
   "`paginated_actions` and the `parser`/`emit` pair compose: the page fan-out happens
   first, then per page the `json_path` parser turns that page's array body into items and
   `emit` forwards each one." Keep the concrete `?page=1` example
   (`[ { "id": 1 }, { "id": 2 } ]` → two `POST`s) and the retry/cooldown/exit paragraph
   unchanged.

3. **Notes section** — the last bullet already describes the live demo
   (`oak_paginated_category_items`) as "`paginated_actions` plus a `parser`/`emit` on the
   page resource" — keep it verbatim, it is now accurate. Add a parser-reference bullet
   next to the existing "Field references" bullet:
   `- Full \`parser.*\` field reference: [Extraction Configuration](../extraction-configuration.md).`
   (or extend the existing "Field references:" bullet to also list Extraction
   Configuration). Keep the lowercase-header-keys and `max_page` bullets.

Do not change `## Scenario` or the run line.

## Files to Change

- `docs/guides/navi/samples/paginated-crawl-emit.md` — add `parser:` block to the
  `items_page` resource, rewrite the `paginated_actions`/`emit` composition sentence to
  name the parser, add an `extraction-configuration.md` link in *Notes*.
