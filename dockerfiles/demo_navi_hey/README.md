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
