# Plan: docs: surface the demo crawl-emit example

Issue: [781-docs-surface-the-demo-crawl-emit-example.md](../../issues/781-docs-surface-the-demo-crawl-emit-example.md)

## Overview

The public `navi-hey` demo now runs a live crawl-and-emit example (issues #780 and #779 have both
landed on `main`). The user-facing feature docs still describe `parser`/`emit` only in the abstract
and never point at the running demonstration. This plan adds a short note in `README.md` plus three
matching pointers in `docs/guides/navi/`, each linking the live demo and mirroring the four-resource
list already documented in `dockerfiles/demo_navi_hey/README.md`'s "Crawl-and-emit example" section.

Docs only. No engine, dev-app, or demo-config changes.

## Context

Facts to write against (verified on `main`):

- **Live demo URL:** <https://navi-hey-demo.tamanduati.tech/> — the `navi-hey` *engine* demo, which
  serves the monitoring web UI. Dashboards: `/#/extractions` and `/#/emissions`.
- **Demo config:** `dockerfiles/demo_navi_hey/navi-config.yml` defines a dedicated `collector`
  client (`linkText: Crawl Collector`, `base_url: $COLLECTOR_BASE_URL`) and puts a `parser` + `emit`
  on four `oak_*` resources — one per parser type:
  - `oak_categories` — `json_path` over the bare-array `GET /categories.json`, mapping `slug` /
    `name`, emitting each category to `POST /collector/oak-categories`.
  - `oak_paginated_category_items` — `json_path` over the bare-array
    `GET /categories/{slug}/items.json?page={page}`, mapping `id` / `name`, emitting each item to
    `POST /collector/oak-category-items/{category_slug}?page={page}` with a `body_template`
    envelope. Runs once per page, alongside the existing `actions` chain.
  - `oak_home` — `css` over the SPA shell's `<head>` `<link>` tags, emitting `{ rel, href }` to
    `POST /collector/oak-home`.
  - `oak_templates` — `regex` capturing the hashed JS bundle name from `GET /?ajax=true`, emitting
    `{ bundle }` to `POST /collector/oak-templates`.
- **Collector sink:** `dev/app/` exposes `POST /collector/:source` (`CollectorHandler`) which logs
  each payload and returns `204`, exempt from failure injection.
- **`dockerfiles/demo_navi_hey/README.md`** already carries a "Crawl-and-emit example" section with
  exactly this four-resource breakdown — the wording added here should mirror it, not diverge.
- Extraction runs in parallel with the existing cache-warming chains.

Insertion points (verified):

- `README.md` — the "Data Extraction and Emission" section ends around line 588 with the
  `See [docs/agents/future/crawler/flows.md]...` line, immediately before the `---` / `## Roadmap`
  heading.
- `docs/guides/navi/emit-configuration.md` — ends with `**Related:**` and `**Related sample:**`
  lines, then `[← Back to How to Use Navi]`.
- `docs/guides/navi/samples.md` — has a `## Crawling` heading with three bullets
  (`emit-extracted-items`, `emit-body-template`, `paginated-crawl-emit`).
- `docs/guides/navi/samples/paginated-crawl-emit.md` — has a `## Notes` section (bullet list) near
  the end, before `[← Back to Samples]`.

## Implementation Steps

### Step 1 — Add the live-demo note to `README.md`

In `README.md`, at the end of the "Data Extraction and Emission" section — after the
`See [docs/agents/future/crawler/flows.md]...` line and before the `---` that precedes `## Roadmap` —
add a short subsection (e.g. `### See it live`) that:

- States that the public [`navi-hey` demo](https://navi-hey-demo.tamanduati.tech/) runs a live
  crawl-and-emit example: while crawling the Oak application it extracts data from four resources
  (one per parser type) and emits every item to a `collector` client backed by a logging endpoint on
  the demo app.
- Lists the four resources compactly, mirroring `dockerfiles/demo_navi_hey/README.md`'s
  "Crawl-and-emit example" section: `oak_categories` (`json_path` → `POST /collector/oak-categories`),
  `oak_paginated_category_items` (`json_path` + `body_template`, once per page →
  `POST /collector/oak-category-items/...`), `oak_home` (`css` → `POST /collector/oak-home`),
  `oak_templates` (`regex` → `POST /collector/oak-templates`).
- Points at the demo's Extractions (`https://navi-hey-demo.tamanduati.tech/#/extractions`) and
  Emissions (`https://navi-hey-demo.tamanduati.tech/#/emissions`) dashboards, and links the config
  at [`dockerfiles/demo_navi_hey/navi-config.yml`](dockerfiles/demo_navi_hey/navi-config.yml).

Keep it to one short paragraph plus the four-item list. Do not restate the full YAML config.

### Step 2 — Add matching pointers across `docs/guides/navi/`

Add a brief pointer to the same live demo in three places, each one or two sentences, consistent
wording with Step 1 and with `dockerfiles/demo_navi_hey/README.md`:

- **`docs/guides/navi/emit-configuration.md`** — near the existing `**Related:**` /
  `**Related sample:**` lines at the bottom, add a `**See it live:**` line noting the public demo
  emits extracted items from four Oak resources (one per parser type) to a `collector` client, with
  a link to the [Emissions dashboard](https://navi-hey-demo.tamanduati.tech/#/emissions).
- **`docs/guides/navi/samples.md`** — under the `## Crawling` heading, add a bullet linking
  <https://navi-hey-demo.tamanduati.tech/> that describes it as the public `navi-hey` demo crawling
  the Oak app and emitting every extracted item to a collector endpoint, watchable on its
  Extractions/Emissions dashboards.
- **`docs/guides/navi/samples/paginated-crawl-emit.md`** — in the `## Notes` list, add a bullet
  noting this exact pattern (`paginated_actions` + `parser`/`emit`) runs live in the demo as
  `oak_paginated_category_items`, emitting each item per page to `POST /collector/oak-category-items/...`.

## Notes

- The user confirmed the engine-demo URL is <https://navi-hey-demo.tamanduati.tech/> (not the
  demo dev-app host). If that host ever changes, all four additions must be updated together.
- Wording must match what #780 shipped — four resources, not three. The original issue text
  predates the merge and mentioned only three; `dockerfiles/demo_navi_hey/README.md` is the
  source of truth for the breakdown.
- No CI check covers `README.md` or `docs/` content (the `.circleci/config.yml` `lint-and-report`
  jobs are scoped to code folders: `source`, `dev/app`, `dev/frontend`, `frontend`,
  `clients/node`, `worker`). The release-only "Check tag matches package.json and README versions"
  job only compares version strings and is unaffected by prose changes.
- Keep every addition English-only and link-first; no walkthroughs.

## Files to Change

- `README.md` — add a short "See it live" subsection at the end of the "Data Extraction and
  Emission" section pointing at the public demo and its four emitting resources.
- `docs/guides/navi/emit-configuration.md` — add a `**See it live:**` pointer near the bottom
  Related links.
- `docs/guides/navi/samples.md` — add a bullet under `## Crawling` linking the live demo.
- `docs/guides/navi/samples/paginated-crawl-emit.md` — add a `## Notes` bullet pointing at the
  live `oak_paginated_category_items` example.
