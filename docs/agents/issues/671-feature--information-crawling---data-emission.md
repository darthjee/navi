## Context

Navi is currently a queue-based cache-warmer written in Node.js: it reads a YAML configuration, discovers HTTP resources that can be requested immediately, fires those requests concurrently through a configurable worker pool, and chains responses into further parameterised requests until the whole resource graph has been warmed.

This feature extends Navi beyond cache-warming, turning it into an **information crawling tool**. When processing the response of a URL, Navi will be able to — in addition to chaining children URLs (existing behavior) — **extract structured data** using configurable parsers and **emit each extracted item** to an external endpoint.

### Job pipeline (current vs. proposed)

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

`ExtractionJob` is parallel to the existing jobs — it does not replace chaining, it adds a new processing branch. A resource can have `actions` (chaining), `assets` (download), and `parser` + `emit` (extraction and emission) simultaneously, or any subset.

### Objectives

1. Allow extraction of structured data from HTTP responses (JSON, HTML, plain text) — not just URL chaining.
2. Support multiple parser types, selected explicitly in the YAML per resource.
3. Send each extracted item individually to a configurable external endpoint, via `EmitJob`.
4. Preserve the existing chaining mechanism for children URL discovery — no changes to the current architecture.
5. Maintain backward compatibility — existing cache-warming configurations continue to work without modification.
6. Reuse the existing clients infrastructure — `EmitJob` references a `client` from the YAML to know where to send data.

## What needs to be done

**Config (engine):**
- New `parser` section in the YAML configuration of each resource, declaring the parser type and match/filter/fields rules.
- New `emit` section in the YAML configuration, declaring the destination for extracted data (`client`, `method`, `url`).

**Jobs (engine):**
- New job type **`ExtractionJob`** — receives the raw body of the response, invokes the configured parser, produces structured items. No retry rights (exhausted on first failure, same as `ActionProcessingJob`/`HtmlParseJob` — parser failures are configuration errors, not transient).
- New job type **`EmitJob`** — receives one extracted item and makes an HTTP request to the configured endpoint. One `EmitJob` per extracted item (no batching). Uses an existing `client` from the YAML (`base_url`, `headers`, `timeout`, etc.). Supports **POST, PUT, PATCH**. Retry policy follows the same pattern as `ResourceRequestJob` (`max-retries`, `retry_cooldown`).
- Built-in parser **regex** — standalone (applied directly on the raw body, not a post-processor of another parser), returns captured groups as fields.
- Built-in parser **`json_path`** — navigates the parsed JSON, filters items by conditions (including field-to-field comparisons, e.g. `bnd_inid == bundle_inid`, not just field-vs-literal), maps fields.
- Children processing continues to reuse existing chaining (`ActionProcessingJob`) — no new discovery mechanism.

**Frontend:**
- Register the new job classes (`ExtractionJob`, `EmitJob`) in `frontend/src/constants/jobClasses.js`.

### Worked example (Loot Studios — reference use case)

```yaml
clients:
  lootstudios:
    base_url: https://app.lootstudios.com
  majora_api:
    base_url: https://majora.example.com
    headers:
      Authorization: Bearer <token>

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

Fetches the JSON catalog, filters miniatures, extracts fields, and emits each miniature to an external registration endpoint — while the existing `actions` block keeps chaining to `miniature_detail` unmodified. See `docs/agents/future/crawler/flows.md` for this and the regex-standalone example in full, and `docs/agents/future/crawler/reference-loot-studios.md` for the real-world crawling pattern this is designed against.

### Out of scope for this issue

The following are intentionally **not** part of this issue and remain tracked only as open questions in `docs/agents/future/crawler/gaps.md` — no sub-issues are being created for them yet: external parser plugin system, the parser contract for external plugins, an expanded CSS-selector parser, batch emission, deduplication/visit-tracking, and custom per-`emit` headers.

The one exception is **field-to-field filter comparison** (`bnd_inid == bundle_inid`) — needed for the real Loot Studios use case — which **is** in scope here and belongs to the `json_path` parser work.

Full design reference: `docs/agents/future/crawler.md` and its subfolder.

## Acceptance criteria

- [ ] `parser` and `emit` YAML sections are supported per-resource and validated
- [ ] `ExtractionJob` extracts structured items using a pluggable parser (regex and `json_path` built in)
- [ ] The `json_path` parser supports filtering, including field-to-field comparisons
- [ ] `EmitJob` sends each extracted item individually to the configured client via POST/PUT/PATCH, with `ResourceRequestJob`-style retries
- [ ] Existing chaining (`actions`) continues to work unmodified, and can be combined with `parser`+`emit` on the same resource
- [ ] The new job classes are registered in the frontend job-class constants
- [ ] The Loot Studios and regex-standalone worked examples in `docs/agents/future/crawler/flows.md` work end-to-end

This issue tracks the feature as a whole and is split into independently workable sub-issues via `arcanum-split-issue`.
