# Flows

## Example: Loot Studios — Miniature Catalog → Majora

The reference use case is crawling Loot Studios: from the `GetMyLootsCache` endpoint (JSON), filter miniatures and register them in the majora system.

**Proposed YAML configuration:**

```yaml
clients:
  lootstudios:
    base_url: https://app.lootstudios.com
  majora_api:
    base_url: https://majora.example.com
    headers:
      Authorization: Bearer 

resources:
  loot_catalog:
    - url: /wp-admin/admin-ajax.php?action=GetMyLootsCache
      status: 200
      client: lootstudios
      parser:
        type: json_path
        match: bundleObjs
        filter:
          - field: obj_type
            equals: miniature
        fields:
          obj_inid: inid
          obj_title: name
          obj_post_id: post_id
          bnd_title: bundle
      emit:
        client: majora_api
        method: POST
        url: /api/miniatures
        headers:
          Authorization: Bearer $MAJORA_API_TOKEN
      actions:
        - resource: miniature_detail
          parameters:
            bundle_inid: parsedBody.obj_inid
```

**Execution flow:**

1. **Startup** → `enqueueFirstJobs()` enqueues `ResourceRequestJob` for `loot_catalog` (no parameters)
2. **ResourceRequestJob** → `GET https://app.lootstudios.com/wp-admin/admin-ajax.php?action=GetMyLootsCache` → JSON response with `bundleObjs[]`
3. **ActionProcessingJob** (existing) → maps `parsedBody.obj_inid` as `bundle_inid`, enqueues `ResourceRequestJob` for `miniature_detail` (normal chaining)
4. **ExtractionJob** (new) → invokes `json_path` parser:
   - Navigates to `bundleObjs` in the parsed JSON
   - Filters items where `obj_type == "miniature"`
   - Maps fields: `obj_inid → inid`, `obj_title → name`, `obj_post_id → post_id`, `bnd_title → bundle`
   - Returns 28 structured items
5. For **each of the 28 items** → enqueues one **`EmitJob`**
6. **EmitJob** → `POST https://majora.example.com/api/miniatures` with body `{ inid, name, post_id, bundle }`

## Example: Regex standalone (Loot Studios Approach B)

For extracting `postid` from the `body class` of an HTML page:

```yaml
resources:
  bundle_page:
    - url: /bundle/tidal-aberrations/?logged-in
      status: 200
      client: lootstudios
      parser:
        type: regex
        match: 'postid-(\d+)'
        field: post_id
      emit:
        client: majora_api
        method: POST
        url: /api/bundles/resolve
```

**Flow:**
1. `ResourceRequestJob` → `GET /bundle/tidal-aberrations/?logged-in` → HTML
2. `ExtractionJob` → applies regex `postid-(\d+)` on the raw body → captures `880433` → returns `{ post_id: "880433" }`
3. `EmitJob` → `POST /api/bundles/resolve` with `{ post_id: "880433" }`

## Interaction with existing chaining

The `ExtractionJob` **does not interfere** with `ActionProcessingJob`. Both process the same response in parallel. A resource can:

- Have only `actions` (pure cache-warming — current behavior)
- Have only `parser` + `emit` (pure extraction — no chaining)
- Have both (crawling with extraction — extracts data AND chains children)

### Interaction with paginated_actions

`ResourceRequestJob.#handleResponse()` runs four things off a single successful response, with
no early return between them: it enqueues asset jobs, enqueues one `ExtractionJob` when the
resource declares `parser` + `emit`, calls `enqueueActions` (normal chaining), and calls
`enqueuePaginatedActions` (pagination fan-out). The `ExtractionJob` is therefore enqueued
**per performed `ResourceRequestJob`**, in parallel with `enqueueActions` and
`enqueuePaginatedActions` — regardless of how that job was enqueued (startup, `actions`
chaining, or `paginated_actions` fan-out).

- When the **origin** resource (whose response drives pagination) also has `parser` + `emit`,
  its `ExtractionJob` → `EmitJob` chain fires exactly once for the origin response,
  independently of the pagination fan-out. `enqueuePaginatedActions` never clears or
  re-enqueues that extraction.
- When the **paginated target** resource has `parser` + `emit`, each per-page
  `ResourceRequestJob` is a distinct instance and runs its own `ExtractionJob` → `EmitJob`
  chain independently — one extraction/emit per page. The per-page parameters (inherited
  parameters + mapped parameters + `{ page_key: page }`) are threaded into
  `ResourceRequest.enqueueExtraction(...)` and on into each `EmitJob`, so that page's values
  are applied to field mapping and to `{:placeholder}` resolution in the emit URL.
- There is no duplication, no missing emits, and no cross-talk between the pagination and
  extraction paths. Each per-page `ResourceRequestJob` also recomputes its own origin URL
  from its resolved page URL, so each page's extraction is attributed to that page.

**Worked example:** a resource `index` paginates over a `product` resource that carries
`parser` + `emit`:

```yaml
resources:
  index:
    - url: /index.json
      status: 200
      client: lootstudios
      paginated_actions:
        - resource: product
          pagination:
            - pages: parsedBody.total_pages
              page_key: page
  product:
    - url: /products/{:page}.json
      status: 200
      client: lootstudios
      parser:
        type: json_path
        match: items
        fields:
          sku: sku
          name: name
      emit:
        client: majora_api
        method: POST
        url: /api/products/{:page}
```

**Flow** (response to `/index.json` has `total_pages: 3`, each page returns 2 items):

1. `ResourceRequestJob` for `index` → `GET /index.json` → `#handleResponse()` has no `parser`,
   so it enqueues one `PaginatedActionProcessingJob` and nothing else.
2. `PaginatedActionProcessingJob` → resolves 3 pages, enqueues one `ResourceRequestJob` per
   page for `product` with parameters `{ page: 1 }`, `{ page: 2 }`, `{ page: 3 }`.
3. Each per-page `ResourceRequestJob` → `GET /products/<page>.json` → `#handleResponse()` sees
   `parser` + `emit` and enqueues one `ExtractionJob` (3 `ExtractionJob`s total, one per page).
4. Each `ExtractionJob` → extracts 2 items → enqueues one `EmitJob` per item
   (2 × 3 = 6 `EmitJob`s total).
5. Each `EmitJob` → `POST https://majora.example.com/api/products/<page>` with the mapped body,
   the `{:page}` token resolved from that page's parameters.
