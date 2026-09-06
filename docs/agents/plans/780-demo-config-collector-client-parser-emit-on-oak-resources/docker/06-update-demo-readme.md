# Update the demo README

Update `dockerfiles/demo_navi_hey/README.md` to document the new client and the crawl-and-emit
behavior.

1. **Env-var list** — add `$COLLECTOR_BASE_URL` to the bullet list under the "Config" section
   (currently `BASE_URL`, `WORKERS`, `RETRY_COOLDOWN`, `MAX_RETRIES`, `TIMOUT`, `LOG_LEVEL`):

   > - `COLLECTOR_BASE_URL` — base URL the `collector` client emits extracted items to. Normally set
   >   to the same value as `BASE_URL` (the `demo_dev_app` service), whose `POST /collector/:source`
   >   endpoint logs each emission.

2. **New "Crawl-and-emit example" section** — a short section (after "Config") describing what the
   demo now extracts and emits:
   - `oak_categories` — `json_path` parser over the bare-array `GET /categories.json`, mapping
     `slug` / `name`, emitting each category to `POST /collector/oak-categories`.
   - `oak_paginated_category_items` — `json_path` parser over the bare-array
     `GET /categories/{slug}/items.json?page={page}`, mapping `id` / `name`, emitting each item to
     `POST /collector/oak-category-items/{category_slug}?page={page}` with a `body_template`
     envelope. Runs once per page, alongside the existing `actions` chain.
   - `oak_home` — `css` parser over the SPA shell's `<head>` `<link>` tags, emitting `{ rel, href }`
     to `POST /collector/oak-home`.
   - `oak_templates` — `regex` parser capturing the hashed JS bundle name from `GET /?ajax=true`,
     emitting `{ bundle }` to `POST /collector/oak-templates`.
   - Note that extraction runs in parallel with the existing cache-warming chains, and that progress
     is visible on the demo's Extractions (`/#/extractions`) and Emissions (`/#/emissions`)
     dashboards.

Keep the README's existing wording style and the intentional `TIMOUT` spelling note.

## Files to Change

- `dockerfiles/demo_navi_hey/README.md` — add `$COLLECTOR_BASE_URL` to the env-var list and a
  "Crawl-and-emit example" section.
