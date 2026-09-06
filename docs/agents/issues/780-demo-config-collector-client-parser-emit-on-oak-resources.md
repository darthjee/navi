# Issue: demo config: collector client + parser/emit on Oak resources

## Description

Parent: #777 — *Demo: crawl the Oak app and emit extracted data to a collector endpoint on the demo dev app*.

The public `navi-hey` demo engine runs off `dockerfiles/demo_navi_hey/navi-config.yml`. That config is
pure cache-warming today: a `default` client crawling the demo dev app (`$BASE_URL`) and an `oak`
client crawling the live Oak application (`$OAK_BASE_URL`), with a full `oak_*` resource tree
(`oak_home`, `oak_categories` → `oak_paginated_categories` → `oak_category` / `oak_category_items` →
`oak_paginated_category_items` → `oak_category_item`, plus `oak_kinds*`). There is **no `parser` or
`emit` anywhere** — so the demo never exercises Navi's data extraction & emission feature.

This sub-issue wires that feature into the demo: the engine extracts structured data while crawling
Oak and emits each item to the demo dev app's collector endpoint, giving the Extractions/Emissions
dashboards live data. We want **one worked example of each parser type** — `json_path`, `css`, and
`regex`.

**Depends on:**

- #778 / #782 — *engine: `json_path` parser supports a root-level array* — **already merged** (commit
  `ce67ccc`). Required here: both Oak list endpoints return bare top-level arrays (see below).
- #777 sub-issue *dev/app: `POST /collector/:source` logging endpoint* — the emit target. `emit.url`
  values here must match that route exactly. Not yet implemented; this issue is sequenced after it.

Reference for `parser`/`emit` YAML: `README.md` "Data Extraction and Emission" + "Configuration File
Fields" table, `docs/guides/navi/emit-configuration.md`, `docs/agents/future/crawler/flows.md`.

### Live Oak payload shapes (fetched 2026-09-06 from `https://oak.ffavs.net`)

- **`GET /categories.json`** → a **bare top-level JSON array**. Each element:
  `{ "name", "slug", "snap_url" }`. Response headers carry `page` / `pages` / `per_page`.
- **`GET /categories/{slug}/items.json`** → a **bare top-level JSON array**. Each element:
  `{ "id", "name", "description", "category_slug", "kind_slug", "snap_url", "links", "link" }`.
- **`GET /` (and every other HTML route, incl. `?ajax=true`)** → Oak is a **single-page app**; the
  server only returns a shell:

  ```html
  <head>
    <meta charset="UTF-8">
    <title>Oak</title>
    <link rel="icon" type="image/png" href="/assets/favicon-0PPx-ZFz.png">
    <script type="module" crossorigin src="/assets/index-qW7hkplz.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-DBkz-poX.css">
  </head>
  <body><div id="root"></div></body>
  ```

  There is **no server-rendered repeated content list** anywhere on Oak (the demo dev app is a SPA
  too). The only repeated markup available to a `css` parser is the `<head>` asset tags; the only
  stable capturable value for a `regex` parser is the hashed asset filename.

## Problem

The demo config exercises only cache-warming and chaining (`actions` / `paginated_actions` /
`assets`). It never declares a `parser` or `emit`, so a developer looking at the live demo sees empty
Extractions and Emissions dashboards and has no worked example of the data-extraction-and-emission
feature in a real config.

## Expected Behavior

- `navi-config.yml` defines a `collector` client using `$COLLECTOR_BASE_URL`.
- Four existing `oak_*` resource-request entries gain a `parser` + `emit` block — one per parser
  type, all emitting to the `collector` client at `POST /collector/oak-*`:
  - `oak_categories` — `json_path` (root array)
  - `oak_paginated_category_items` — `json_path` (root array), with per-page parameters threaded into
    **both** `emit.url` and `emit.body_template`
  - `oak_home` — `css` over the shell `<head>` asset tags
  - `oak_templates` (first entry, `GET /?ajax=true`) — `regex` capturing the hashed JS bundle name
- All pre-existing resources and `actions` / `paginated_actions` / `assets` chains in the config are
  unchanged; only `parser` / `emit` keys and the new `collector` client are added.
- `dockerfiles/demo_navi_hey/README.md` documents `$COLLECTOR_BASE_URL` and the crawl-and-emit
  example.
- Running `navi-hey -c dockerfiles/demo_navi_hey/navi-config.yml` (with `BASE_URL`, `OAK_BASE_URL`,
  `COLLECTOR_BASE_URL`, `WORKERS`, `RETRY_COOLDOWN`, `MAX_RETRIES`, `TIMOUT` set) produces
  `GET /extractions.json` records for the `json_path`, `css`, and `regex` parsers with non-zero
  `itemCount`, and `GET /emissions.json` records with `status: "success"`, `method: "POST"`, `url`
  ending `/collector/oak-*`, and `failed` / `dead` counts of `0`.
- The demo dev app logs one `CollectorHandler: received emission` line per emitted item.

## Solution

Config-only + README + a Render env var. **No engine or dev-app code changes here.** Owner: `docker`
agent (owns `dockerfiles/` and the demo config).

### 1. Add a dedicated `collector` client

In `dockerfiles/demo_navi_hey/navi-config.yml`:

```yaml
collector:
  linkText: Crawl Collector
  base_url: $COLLECTOR_BASE_URL
  timeout: $TIMOUT
```

Normally `$COLLECTOR_BASE_URL` is set to the same URL as `$BASE_URL` — the demo dev app.

### 2. Add `parser` + `emit` to four existing `oak_*` resource-request entries

Leave every existing `actions` / `paginated_actions` / `assets` block on those entries untouched —
extraction runs in parallel with chaining.

- **`oak_categories`** (`GET /categories.json`, `json_path`) — root-array form (omit `parser.match`),
  `parser.fields: { slug: slug, name: name }`. `emit`: `client: collector`, `method: POST`,
  `url: /collector/oak-categories`.
- **`oak_paginated_category_items`** (`GET /categories/{:category_slug}/items.json?page={:page}`,
  `json_path`) — root-array form, `parser.fields: { id: id, name: name }`. `emit`:
  `client: collector`, `method: POST`,
  `url: /collector/oak-category-items/{:category_slug}?page={:page}` **and** a `body_template` that
  wraps the item, e.g.

  ```yaml
  body_template:
    category_slug: "{:category_slug}"
    page: "{:page}"
    item: "{:.}"
  ```

  Demonstrates the same per-page parameters threading through the URL and the body, and extraction
  running once per page alongside `paginated_actions`.
- **`oak_home`** (`GET /` on the `oak` client, HTML shell, `css`) — selector `link[href]` (matches
  the stylesheet + favicon `<link>` tags, ~2 items), `parser.fields:
  { rel: { attribute: rel }, href: { attribute: href } }`. `emit`: `client: collector`,
  `method: POST`, `url: /collector/oak-home`.
- **`oak_templates`** first entry (`GET /?ajax=true` on the `oak` client, HTML shell, `regex`) —
  `parser.match`: a pattern capturing the hashed module script, e.g.
  `src="/assets/(index-[^"]+\.js)"`, `parser.field: bundle`. `emit`: `client: collector`,
  `method: POST`, `url: /collector/oak-templates`.

Verify the exact selector / regex against a fresh fetch at implementation time (asset hashes change
on every Oak deploy).

### 3. Update `dockerfiles/demo_navi_hey/README.md`

- add `$COLLECTOR_BASE_URL` to the env-var list (note it is normally the same as `$BASE_URL`),
- add a short "Crawl-and-emit example" section describing what the four resources extract and emit.

### 4. Deploy step (not a code change)

Set `$COLLECTOR_BASE_URL` on the `navi-hey` Render service.

## Benefits

- The public demo becomes a worked example of `parser` + `emit`, covering all three parser types
  (`json_path`, `css`, `regex`) in a real config.
- The demo's Extractions and Emissions dashboards show live, non-zero data.
- Exercises extraction running in parallel with `actions` / `paginated_actions` chaining, and
  per-page parameter threading into both an emit URL and an emit body template.
