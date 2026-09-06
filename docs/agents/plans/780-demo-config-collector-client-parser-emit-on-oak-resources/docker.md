# docker Plan: demo config: collector client + parser/emit on Oak resources

Issue: [780-demo-config-collector-client-parser-emit-on-oak-resources.md](../issues/780-demo-config-collector-client-parser-emit-on-oak-resources.md)

## Overview

All work is in `dockerfiles/demo_navi_hey/` (owned by the `docker` agent). Add a `collector` client
to `navi-config.yml`, attach `parser` + `emit` to four existing `oak_*` entries (`oak_categories`,
`oak_paginated_category_items`, `oak_home`, `oak_templates`), and document `$COLLECTOR_BASE_URL` +
the crawl-and-emit example in the demo README. No engine or dev-app code changes.

## Context

- The demo engine runs off `dockerfiles/demo_navi_hey/navi-config.yml` (copied to
  `/home/node/app/config/navi_config.yml`, `$VAR` tokens interpolated at container start). Today it
  declares only `default` + `oak` clients and a cache-warming-only resource tree — **no `parser` or
  `emit` anywhere**.
- Dependency **#782** (`json_path` root-level array — `match` omitted treats the whole body as the
  item array) is **merged** (`ce67ccc`). Required here.
- Dependency: the sibling `#777` sub-issue *dev/app: `POST /collector/:source` logging endpoint* is
  **not yet implemented**. `emit.url` paths here (`/collector/oak-*`) must match that route once it
  lands. This plan can be committed now but end-to-end verification needs that endpoint live.

### Live Oak payload shapes (verified 2026-09-06 against `https://oak.ffavs.net`)

- `GET /categories.json` → **bare top-level JSON array**; each element `{ name, slug, snap_url }`.
- `GET /categories/{slug}/items.json` → **bare top-level JSON array**; each element
  `{ id, name, description, category_slug, kind_slug, snap_url, links, link }`.
- `GET /` and `GET /?ajax=true` → Oak is a **SPA**; the server returns only a shell:
  `<title>Oak</title>`, `<link rel="icon" ... href="/assets/favicon-<hash>.png">`,
  `<link rel="stylesheet" ... href="/assets/index-<hash>.css">`,
  `<script type="module" crossorigin src="/assets/index-<hash>.js"></script>`, `<div id="root">`.
  No server-rendered content list exists — the `css` and `regex` examples target the `<head>` asset
  tags. **Asset hashes change on every Oak deploy** — re-fetch and adjust the selector/regex at
  implementation time.

### `parser` / `emit` mechanics that constrain this plan

- `parser` runs *in parallel with* `actions` / `paginated_actions` / `assets` — adding it never
  disturbs existing chaining. Leave every existing block on the four entries untouched.
- `emit.url` `{:placeholder}` tokens resolve from the **resource-request chain parameters**
  (`EmitJob` → `ResourceRequestEmit.resolveUrl(parameters)`), so `{:category_slug}` and `{:page}` are
  available on `oak_paginated_category_items`.
- `emit.body_template` tokens resolve **only against the extracted item**
  (`BodyTemplateRenderer.render(node, item)`), *not* the chain parameters. `{:.}` is the whole item;
  `{:field}` / `{:nested.path}` are item fields. A token that does not resolve on the item is left as
  literal `{:...}` text. Therefore `{:page}` **cannot** be used in `body_template` (it is not an item
  field); per-page parameter threading is demonstrated through `emit.url` only. `{:category_slug}` in
  a body template resolves only because the Oak item happens to carry a `category_slug` field.
- `json_path` root-array form: omit `parser.match` entirely; `parser.fields` (a
  `{ sourceKey: outputKey }` map) is still required.
- `css`: `parser.match` is the selector for the repeated container elements; `parser.fields` is a
  `{ outputKey: { selector, attribute, array, trim } }` map, each field resolved relative to the
  container (empty/absent `selector` = the container element itself).
- `regex`: `parser.match` is the pattern (first capture group is the value); `parser.field` names the
  single output key.
- `EmitJob` retry policy is independent of `workers.*`: 5 retries / 5000 ms by default; retries on
  5xx/429/408/network, dead-letters other 4xx immediately.

## Steps

- [01 — Add the collector client](docker/01-add-collector-client.md)
- [02 — oak_categories: json_path (root array) + emit](docker/02-oak-categories-json-path-emit.md)
- [03 — oak_paginated_category_items: json_path (root array) + emit with URL tokens + body_template](docker/03-oak-paginated-category-items-json-path-emit.md)
- [04 — oak_home: css parser over <head> asset tags + emit](docker/04-oak-home-css-emit.md)
- [05 — oak_templates: regex parser over the JS bundle name + emit](docker/05-oak-templates-regex-emit.md)
- [06 — Update the demo README](docker/06-update-demo-readme.md)

## CI Checks

No automated check covers `dockerfiles/demo_navi_hey/`. The CircleCI `lint-and-report` jobs are
per-package JS linting (`source`, `dev/app`, `dev/frontend`, `worker`, `clients/node`); the
`build-and-release-demo` job only triggers a Render deploy on version tags and does not validate the
config. Verify manually instead:

- With a local demo dev app running (provides both `$BASE_URL` and `$COLLECTOR_BASE_URL`) and the
  `POST /collector/:source` endpoint available, run
  `navi-hey -c dockerfiles/demo_navi_hey/navi-config.yml` with `BASE_URL`, `OAK_BASE_URL`,
  `COLLECTOR_BASE_URL`, `WORKERS`, `RETRY_COOLDOWN`, `MAX_RETRIES`, `TIMOUT` set.
- `GET /extractions.json` shows records with `parserType` `json_path`, `css`, and `regex`, each with
  non-zero `itemCount`.
- `GET /emissions.json` shows records with `status: "success"`, `method: "POST"`, `url` ending
  `/collector/oak-*`, and `counts.failed` / `counts.dead` both `0`.
- The demo dev app logs one `CollectorHandler: received emission` line per emitted item.
- At minimum (endpoint not yet available): confirm the YAML still parses and the engine boots without
  a config error, and that `emit` records appear (they will be `failed`/`dead` against a missing
  endpoint, which is expected until `#777`'s collector endpoint lands).

## Notes

- **Deploy step, not a code change:** set `$COLLECTOR_BASE_URL` on the `navi-hey` Render service
  (normally the same URL as `$BASE_URL`). Call this out in the PR description so it is not missed.
- Keep the existing `$TIMOUT` misspelling — it is the real variable name in this file.
- The four `oak_*` entries already carry `client: oak`; the `emit` block overrides the client
  per-request via `client: collector`, so the emitted request goes to `$COLLECTOR_BASE_URL`, not Oak.
- `oak_categories` returns `pages: 1` today, so its `json_path` extraction runs once over all
  categories; `oak_paginated_category_items` runs the extraction once per page, alongside its
  `actions` fan-out to `oak_category_item`.
- Asset hashes in the `css` selector / `regex` pattern must be matched with a wildcard
  (`index-<hash>.js`), never a literal hash — they change on every Oak deploy.
