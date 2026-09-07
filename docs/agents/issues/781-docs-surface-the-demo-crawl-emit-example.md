# Issue: docs: surface the demo crawl-emit example

## Description

Issues #780 ("demo config: `collector` client + `parser`/`emit` on Oak resources") and #779 ("dev/app: POST /collector/:source logging endpoint") have both landed on `main`. The public `navi-hey` demo now runs a live crawl-and-emit example end to end, alongside its existing cache-warming:

- The demo config (`dockerfiles/demo_navi_hey/navi-config.yml`) adds a dedicated `collector` client and puts a `parser` + `emit` on four `oak_*` resources, one per parser type.
- The demo dev app (`dev/app/`) now exposes `POST /collector/:source`, which logs each emitted payload and returns `204`, exempt from failure injection.

The four emitting resources (mirroring `dockerfiles/demo_navi_hey/README.md`'s "Crawl-and-emit example" section):

- `oak_categories` — `json_path` parser over the bare-array `GET /categories.json`, mapping `slug` / `name`, emitting each category to `POST /collector/oak-categories`.
- `oak_paginated_category_items` — `json_path` parser over the bare-array `GET /categories/{slug}/items.json?page={page}`, mapping `id` / `name`, emitting each item to `POST /collector/oak-category-items/{category_slug}?page={page}` with a `body_template` envelope. Runs once per page, alongside the existing `actions` chain.
- `oak_home` — `css` parser over the SPA shell's `<head>` `<link>` tags, emitting `{ rel, href }` to `POST /collector/oak-home`.
- `oak_templates` — `regex` parser capturing the hashed JS bundle name from `GET /?ajax=true`, emitting `{ bundle }` to `POST /collector/oak-templates`.

Extraction runs in parallel with the cache-warming chains, and progress is visible on the navi-hey engine demo's Extractions (`/#/extractions`) and Emissions (`/#/emissions`) dashboards at <https://navi-hey-demo.tamanduati.tech/>. The user-facing feature docs still describe the `parser`/`emit` config only in the abstract and never point at this running demonstration.

## Problem

The feature docs — `README.md`'s "Data Extraction and Emission" section, `docs/guides/navi/extraction-configuration.md`, `docs/guides/navi/emit-configuration.md`, and the `docs/guides/navi/samples/` crawl-emit recipes — explain how to configure `parser`/`emit` but never tell the reader that the public demo runs a working example they can watch live. A reader following the guide has no pointer from the feature docs to the running demonstration, so the demo stays an undiscoverable asset.

## Expected Behavior

- `README.md`, in or just after the "Data Extraction and Emission" section (before "Roadmap"), carries a short note — a couple of sentences and a link — that the public `navi-hey` demo runs a live crawl-and-emit example: it extracts data while crawling the Oak app and emits each item to a `collector` endpoint on the demo dev app, visible on the demo's Extractions and Emissions dashboards at <https://navi-hey-demo.tamanduati.tech/>.
- `docs/guides/navi/` carries matching pointers from the emit docs to the same demo, so a reader following the guide knows where to see it working.
- The wording matches the resources, parsers, and endpoints #780 / #779 actually shipped — the four-resource list above, mirroring `dockerfiles/demo_navi_hey/README.md`'s "Crawl-and-emit example" section.
- English only. No engine, dev-app, or demo-config changes — docs only.

## Solution

- In `README.md`, add the note near the "Data Extraction and Emission" section, linking to <https://navi-hey-demo.tamanduati.tech/> and to `dockerfiles/demo_navi_hey/` (its `navi-config.yml` + README) for the configuration detail.
- Add pointers in `docs/guides/navi/` in all three places:
  - `emit-configuration.md` — a short "see it live" note.
  - `samples.md` — a line under the "Crawling" heading pointing at the live demo.
  - `samples/paginated-crawl-emit.md` — a pointer in its Notes section.
- Keep every addition brief: describe what the four demo resources extract (per parser type) and where the emissions land, mirroring `dockerfiles/demo_navi_hey/README.md`'s "Crawl-and-emit example" section rather than restating the full config.
- Owner: `docs` agent.

## Benefits

- A reader of the extraction/emission docs can see the feature working end to end, on real data, without standing up their own config.
- The feature docs and the live demo stay cross-referenced, so the demo stops being an undiscoverable asset.
