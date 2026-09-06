# oak_categories: json_path (root array) + emit

Attach a `parser` + `emit` block to the **first** request entry of the `oak_categories` resource in
`dockerfiles/demo_navi_hey/navi-config.yml` — the `url: /categories.json` / `status: 200` entry that
already carries `paginated_actions`. Leave the `paginated_actions` block and the other two entries
(`/categories` 302, `/#/categories` 200) exactly as they are — extraction runs in parallel with
chaining.

`GET /categories.json` returns a **bare top-level JSON array** of
`{ name, slug, snap_url }` objects, so use the `json_path` root-array form: **omit `parser.match`**.
`parser.fields` is still required — map `slug` and `name`.

```yaml
  oak_categories:
    - url: /categories.json
      client: oak
      status: 200
      paginated_actions:
        - resource: oak_paginated_categories
          pagination:
            - pages: headers['pages']
            - page_key: page
            - zero_indexed: false
      parser:
        type: json_path
        fields:
          slug: slug
          name: name
      emit:
        client: collector
        method: POST
        url: /collector/oak-categories
    - url: /categories
      client: oak
      status: 302
    - url: /#/categories
      client: oak
      status: 200
```

Each of the ~4 categories is emitted as its own `POST $COLLECTOR_BASE_URL/collector/oak-categories`
with body `{ "slug": ..., "name": ... }`.

## Files to Change

- `dockerfiles/demo_navi_hey/navi-config.yml` — add `parser` + `emit` to the first `oak_categories`
  entry.
