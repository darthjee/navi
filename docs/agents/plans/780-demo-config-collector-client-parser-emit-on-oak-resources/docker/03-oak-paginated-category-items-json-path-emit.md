# oak_paginated_category_items: json_path (root array) + emit with URL tokens + body_template

Attach a `parser` + `emit` block to the **first** request entry of `oak_paginated_category_items` in
`dockerfiles/demo_navi_hey/navi-config.yml` — the
`url: /categories/{:category_slug}/items.json?page={:page}` / `status: 200` entry that already
carries `actions` (chaining to `oak_category_item`). Leave that `actions` block and the other two
entries untouched.

`GET /categories/{slug}/items.json` returns a **bare top-level JSON array** of
`{ id, name, description, category_slug, kind_slug, snap_url, links, link }` objects — use the
`json_path` root-array form (**omit `parser.match`**), mapping `id` and `name`.

This entry is the demo of **per-page parameter threading**: the chain parameters `category_slug` and
`page` are both available to `emit.url` token resolution, so thread both into the URL. Also add a
`body_template` — but note its tokens resolve **against the extracted item only**, never the chain
parameters, so it must not reference `{:page}`. Use `{:.}` (whole item), `{:id}`, `{:name}`, and
`{:category_slug}` (the last resolves because the Oak item itself carries a `category_slug` field).

```yaml
  oak_paginated_category_items:
    - url: /categories/{:category_slug}/items.json?page={:page}
      client: oak
      status: 200
      actions:
        - resource: oak_category_item
          parameters:
            id: parsedBody.id
            category_slug: parsedBody.category_slug
      parser:
        type: json_path
        fields:
          id: id
          name: name
      emit:
        client: collector
        method: POST
        url: /collector/oak-category-items/{:category_slug}?page={:page}
        body_template:
          source: oak-category-items
          category_slug: "{:category_slug}"
          item: "{:.}"
    - url: /categories/{:category_slug}/items?page={:page}
      client: oak
      status: 302
    - url: /#/categories/{:category_slug}/items?page={:page}
      client: oak
      status: 200
```

For each item on each page, Navi enqueues
`POST $COLLECTOR_BASE_URL/collector/oak-category-items/<slug>?page=<n>` with body
`{ "source": "oak-category-items", "category_slug": "<slug>", "item": { ...the mapped item... } }`.
Extraction + emit runs once per page, alongside the `actions` fan-out.

## Files to Change

- `dockerfiles/demo_navi_hey/navi-config.yml` — add `parser` + `emit` (with `url` tokens and
  `body_template`) to the first `oak_paginated_category_items` entry.
