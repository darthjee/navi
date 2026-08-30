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
