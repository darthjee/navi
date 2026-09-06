# demo_navi_hey

Docker image for the public **navi-hey** engine demo. It is built `FROM
darthjee/navi-hey:<version>` (the production image, see
[`dockerfiles/production_navi_hey`](../production_navi_hey)) and layers the
demo's own `navi-config.yml` on top, pointing the demo store's target app
(the `demo_dev_app` image) as the crawl target.

## Build & deploy

Built and released by the CircleCI `build-and-release-demo` job, which
triggers a Render deploy for `RENDER_SERVICE_NAME=$DEMO_RENDER_SERVICE_NAME`
(Render project `navi-hey`).

## Config

The image copies `navi-config.yml` to
`/home/node/app/config/navi_config.yml` and then sets:

```dockerfile
ENV NAVI_CONFIG=./config/navi_config.yml
```

This override is required. The base `production_navi_hey` image already
bakes in its own `ENV NAVI_CONFIG=./config/web.yml` (an empty
`resources: {}` / `clients: {}` config) and a `CMD navi-hey -c $NAVI_CONFIG`
that reads whatever `NAVI_CONFIG` resolves to at container start. Without
re-pointing `NAVI_CONFIG` at the demo's copied-in file, the container
silently keeps running the base image's empty default config instead of
`navi-config.yml` — no error, just idle workers with no resources/clients
configured. Do not drop this `ENV` line when touching this Dockerfile.

`navi-config.yml` itself is interpolated from environment variables at
runtime by navi-hey's own `$VAR` resolver (see
`source/lib/common/utils/env_resolver/EnvStringResolver.js`), so no extra
scripting is needed in the image. The variables it expects:

- `BASE_URL` — base URL of the default target (the `demo_dev_app` service).
- `COLLECTOR_BASE_URL` — base URL the `collector` client emits extracted
  items to. Normally set to the same value as `BASE_URL` (the `demo_dev_app`
  service), whose `POST /collector/:source` endpoint logs each emission.
- `WORKERS` — number of crawl workers.
- `RETRY_COOLDOWN` — cooldown (ms) between retries.
- `MAX_RETRIES` — max retry attempts per resource.
- `TIMOUT` — request timeout (as named in `navi-config.yml`; note the typo
  is intentional/pre-existing, not a mistake in this README).
- `LOG_LEVEL` — engine log verbosity (inherited from navi-hey's own
  `BaseLogger`, not specific to this config file).

All other `ENV` settings from the base `production_navi_hey` image (`PORT`,
`AUTOSTART`, `IDLE_TIMEOUT`, `API_TOKEN`, `ENABLE_SHUTDOWN`,
`LOGS_PAGE_SIZE`) still apply and can be overridden the same way.

## Crawl-and-emit example

Beyond cache-warming, the demo config also extracts data from the Oak
application (`OAK_BASE_URL`) and emits each extracted item to the
`collector` client (`COLLECTOR_BASE_URL`):

- `oak_categories` — `json_path` parser over the bare-array
  `GET /categories.json`, mapping `slug` / `name`, emitting each category to
  `POST /collector/oak-categories`.
- `oak_paginated_category_items` — `json_path` parser over the bare-array
  `GET /categories/{slug}/items.json?page={page}`, mapping `id` / `name`,
  emitting each item to
  `POST /collector/oak-category-items/{category_slug}?page={page}` with a
  `body_template` envelope. Runs once per page, alongside the existing
  `actions` chain.
- `oak_home` — `css` parser over the SPA shell's `<head>` `<link>` tags,
  emitting `{ rel, href }` to `POST /collector/oak-home`.
- `oak_templates` — `regex` parser capturing the hashed JS bundle name from
  `GET /?ajax=true`, emitting `{ bundle }` to `POST /collector/oak-templates`.

Extraction runs in parallel with the existing cache-warming chains, and
progress is visible on the demo's Extractions (`/#/extractions`) and
Emissions (`/#/emissions`) dashboards.
