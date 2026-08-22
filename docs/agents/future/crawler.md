# Feature: Information Crawling & Data Emission

## Overview

Navi is currently a **queue-based cache-warmer** written in Node.js, designed to run inside Docker. It reads a YAML configuration file, discovers which HTTP resources can be requested immediately (no parameters required), fires those requests concurrently using a configurable worker pool, and chains the responses into further parameterised requests — repeating until the entire resource graph has been warmed. An optional read-only web monitoring interface allows observing jobs and workers in real time.

This feature **extends Navi beyond cache-warming**, turning it into an **information crawling tool**. When processing the response of a URL, Navi will be able to — in addition to chaining children URLs (existing behavior) — **extract structured data** using configurable parsers and **emit each extracted item** to an external endpoint.

### Job Pipeline (current vs. proposed)

```
ResourceRequestJob (performs the HTTP request — EXISTING)
       │
       ├─→ ActionProcessingJob (chaining — EXISTING)
       │     maps parameters and enqueues child ResourceRequestJobs
       │
       ├─→ HtmlParseJob (assets — EXISTING)
       │     extracts URLs from CSS/JS and enqueues AssetDownloadJobs
       │
       └─→ ExtractionJob (NEW)
             uses the configured parser to extract data from the raw body
               │
               ├─→ EmitJob (NEW — one per item)
               │     sends the extracted payload to an external endpoint
               │
               └─→ [child chaining reuses ActionProcessingJob]
```

The `ExtractionJob` is **parallel** to existing jobs — it does not replace chaining, it adds a new processing branch. A resource can have `actions` (chaining), `assets` (download), and `parser` + `emit` (extraction and emission) simultaneously, or any subset.

## Objectives

1. **Allow extraction of structured data** from HTTP responses (JSON, HTML, plain text) — not just URL chaining
2. **Support multiple parser types**, selected explicitly in the YAML per resource
3. **Send each extracted item individually** to a configurable external endpoint, via `EmitJob`
4. **Preserve the existing chaining mechanism** for children URL discovery — no changes to the current architecture
5. **Maintain backward compatibility** — existing cache-warming configurations continue to work without modification
6. **Reuse the existing clients infrastructure** — the `EmitJob` references a `client` from the YAML to know where to send data

## Scope

### Included in this feature

- New `parser` section in the YAML configuration of each resource, declaring the parser type and match/filter/fields rules
- New `emit` section in the YAML configuration, declaring the destination for extracted data (client, method, url)
- New job type: **`ExtractionJob`** — receives the raw body of the response, invokes the configured parser, produces structured items
- New job type: **`EmitJob`** — receives one extracted item and makes an HTTP request to the configured endpoint
- Built-in parser: **regex standalone** — applied directly on the raw body, returns captured groups as fields
- Built-in parser: **json_path** — navigates the parsed JSON, filters items by conditions, maps fields
- `EmitJob` enqueued **one per extracted item** (no batching)
- `EmitJob` uses an existing `client` from the YAML (with `base_url`, `headers`, `timeout`, etc.)
- `EmitJob` supports multiple HTTP methods: **POST, PUT, PATCH** (for upsert scenarios)
- `EmitJob` retry policy follows the **same pattern as `ResourceRequestJob`** (retries via `max-retries` and `retry_cooldown`)
- `ExtractionJob` has **no retry rights** — exhausted on first failure (same as `ActionProcessingJob` and `HtmlParseJob`)

### Out of scope (future)

- **External parser plugin system** (npm packages, local files, programmatic registration) — the architecture should allow future extension, but the mechanism is not defined in this feature
- **Parser contract for external plugins** — the input/output interface for plugins — left open
- **Batch emission** (multiple items in a single payload) — currently one `EmitJob` per item; the architecture should allow adding this later
- **Visit tracking / deduplication** between executions — no persistence of visited URLs
- **Post-processing of parser output** (e.g., regex applied on top of CSS selector result) — not supported in this version
- **Expanded CSS selector parser** for HTML data extraction (beyond what `HtmlParser` already does for assets) — future; regex covers simple HTML cases for now

## Flows

### Example: Loot Studios — Miniature Catalog → Majora

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
          inid: obj_inid
          name: obj_title
          post_id: obj_post_id
          bundle: bnd_title
      emit:
        client: majora_api
        method: POST
        url: /api/miniatures
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

### Example: Regex standalone (Loot Studios Approach B)

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

### Interaction with existing chaining

The `ExtractionJob` **does not interfere** with `ActionProcessingJob`. Both process the same response in parallel. A resource can:

- Have only `actions` (pure cache-warming — current behavior)
- Have only `parser` + `emit` (pure extraction — no chaining)
- Have both (crawling with extraction — extracts data AND chains children)

## Decisions

| # | Decision | Rationale |
|---|---------|-----------|
| 1 | Parser is selected **explicitly** in the YAML per resource | Full user control; does not assume content-type automatically |
| 2 | Regex is a **standalone parser** | Applied directly on the raw body; not a post-processor of another parser |
| 3 | Parser receives the **raw body** (string) as input | Simplicity; the parser decides how to interpret the content |
| 4 | `ExtractionJob` is a **new job type**, parallel in the chain | Does not couple extraction with chaining; allows free combination |
| 5 | `EmitJob` is a **new job type**, one per extracted item | Granular retry control and tracking; each item is independent |
| 6 | Children processing **reuses existing chaining** (`ActionProcessingJob`) | Does not invent a new discovery mechanism; uses what already works |
| 7 | `emit` uses **existing `clients`** from the YAML | Reuses authentication, timeout, and headers infrastructure |
| 8 | Job name: **`EmitJob`** | "Emits" data out of Navi; clean and descriptive |
| 9 | `EmitJob` retry policy follows **`ResourceRequestJob` pattern** | Retries via `max-retries` and `retry_cooldown`; consistent with existing HTTP job behavior |
| 10 | `ExtractionJob` has **no retry rights** | Exhausted on first failure; same as `ActionProcessingJob` and `HtmlParseJob` — parser failures are configuration errors, not transient |
| 11 | `EmitJob` supports **POST, PUT, and PATCH** methods | Covers create, upsert, and partial update scenarios |

## Gaps

The following points are **not fully defined** in this feature and are left open for future discussion or incremental implementation:

1. **External parser plugin system** — how npm packages or local files would be registered, discovered, and versioned. The architecture should allow extension, but the mechanism is not defined here. **Status: future, leave as idea.**

2. **Parser contract for external plugins** — the exact interface: what the parser receives (raw body string? response wrapper with headers?), what it returns (array of objects? object with fields? stream?). Tied to gap #1. **Status: open, part of future plugin system.**

3. **Expanded CSS selector parser** — the current `HtmlParser` extracts URLs from attributes (`href`, `src`). Extending it to extract text and arbitrary attributes as data (not URLs) is a natural extension, but outside the initial scope. Regex covers simple HTML cases. **Status: future.**

4. **Batch emission** — currently one `EmitJob` per item. For large catalogs (e.g., 28 miniatures = 28 POSTs), batching may be desirable. **Status: future. The architecture should allow adding this later.**

5. **Deduplication / visit tracking** — if the same resource is processed multiple times (e.g., multiple Navi runs), the same items will be emitted repeatedly. No idempotency control. **Status: future. To be determined whether this is Navi's responsibility or the receiving endpoint's.**

6. **Multi-condition filter syntax** — the Loot Studios use case requires filtering `obj_type == "miniature"` AND `bnd_inid == bundle_inid`. The filter syntax for multiple conditions is not fully defined. **Status: to be defined.**

7. **Custom headers per `emit`** — the `client` already provides base headers. It may be necessary to add specific headers per `emit` (e.g., explicit `Content-Type: application/json`). **Status: to be defined.**

## Reference: Loot Studios Crawling Pattern

This feature is designed with the following real-world crawling pattern as reference:

| Approach | Endpoint | Auth | Return | Use |
|----------|----------|------|--------|-----|
| A — GetMyLootsCache | GET `/wp-admin/admin-ajax.php?action=GetMyLootsCache` | No | JSON | Full catalog of bundles and miniatures |
| B — Load_ObjectExplorer | POST `/wp-admin/admin-ajax.php` | Yes (PHPSESSID) | HTML fragment | Miniatures of a specific bundle |
| C — Image URL parsing | GET `/bundle/{slug}/` | Partial | HTML | inid values embedded in asset URLs |

**Approach A (recommended)** is the primary use case for this feature: fetch the JSON catalog, filter miniatures by `obj_type` and `bnd_inid`, extract fields (`obj_inid`, `obj_title`, `obj_post_id`, `bnd_title`), and emit each miniature to an external registration endpoint.

**Approach B** demonstrates the regex parser use case: fetch the bundle HTML page, apply regex `postid-(\d+)` on the raw body to extract the WordPress post ID, and emit it for further processing.
