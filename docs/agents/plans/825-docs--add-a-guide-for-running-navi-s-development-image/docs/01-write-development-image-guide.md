# Write the development-image guide

Create `docs/guides/navi/option-e-development-image.md`, mirroring the tone/structure of `option-a-docker-image.md` / `option-d-hosted-server.md` (a lead blockquote/paragraph explaining what the image is, then task-oriented sections, then a `[← Back to How to Use Navi](../how_to_use_navi.md)` footer link).

Cover, in this order:

1. **What it is / when to use it** — the `navi:dev` image, built from `dockerfiles/dev_navi_hey/Dockerfile` via `make build-dev`. State plainly that, unlike the production `darthjee/navi-hey` image, it bundles no application code (the Dockerfile only installs dependencies) — running it always requires a local checkout of this repo, since `docker-compose.yml`'s `base` service mounts `./source`, `./worker`, and `./docker_volumes/config` into it at runtime. Position it as the path for trying Navi out or developing against it locally without a production build.

2. **Standalone run** (primary path) — first-time setup mirrors `make setup` (copy `docker_volumes/config/navi_config.yml.sample` if `docker_volumes/config/navi_config.yml` doesn't exist yet, run `yarn install` once so `docker_volumes/node_modules` is populated), then:

   ```bash
   make build-dev

   docker run --rm -p 3000:3000 \
     -v $(pwd)/source:/home/node/app \
     -v $(pwd)/worker:/home/node/worker \
     -v $(pwd)/docker_volumes/config:/home/node/app/config \
     -v $(pwd)/docker_volumes/node_modules:/home/node/app/node_modules \
     navi:dev \
     node bin/navi.js -c config/navi_config.yml
   ```

   Note this mirrors the `base`/`navi_app` service shape in `docker-compose.yml` (verify the exact mount paths and port against the current `docker-compose.yml` before publishing — they're the source of truth). Exposes the same web UI / API routes as production Option A (link `./reference.md`).

3. **`navi_extensions_app` subsection** — the Compose service that runs this same image with `NAVI_EXTENSIONS_ENABLED=true` on port `3040`. State clearly that it requires building `examples/navi-orders-extension` first (`cd examples/navi-orders-extension && npm ci && npm run build`, mirroring the `smoke-extensions` Makefile target), then `docker compose up navi_extensions_app`. Cross-link to `./extending-navi.md` for the extensions-authoring workflow itself rather than re-explaining it here.

4. **One-line cross-reference** — note that the same `navi:dev` image also backs the unrelated `navi_app` service used via `make dev` to open an interactive shell (`yarn test`, `yarn lint`) — it does not serve HTTP — and point to the root `README.md`'s Development section for that workflow.

5. **Relationship to `dev/`** — a short paragraph distinguishing this guide's subject from the `dev/` folder (`navi_dev_app`, `navi_dev_frontend`, `navi_proxy`, `navi_web_proxy`): that's a separate sample target backend + Tent reverse proxies used to exercise Navi's cache-warming behavior against a controlled dataset, already documented in `docs/agents/dev-app.md` / `docs/agents/dev-proxy.md` — not something this guide re-documents.

## Files to Change

- `docs/guides/navi/option-e-development-image.md` — new guide, content as above.
