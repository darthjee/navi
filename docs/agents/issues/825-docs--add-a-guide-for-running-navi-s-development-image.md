# Issue: Docs: add a guide for running Navi's development image

## Description
`docs/guides/navi/` documents four production deployment options for `navi-hey` (Docker image, npm package, CircleCI executor, hosted server + client), but has no guide for running Navi's own development image locally — the `navi:dev` image built from `dockerfiles/dev_navi_hey/Dockerfile`. This is the path for someone who wants to try Navi out or develop against it without going through a production build.

Unlike the production image, `navi:dev` bundles no application code — the Dockerfile only installs dependencies. `docker-compose.yml` mounts `./source`, `./worker`, and `docker_volumes/config` into it at runtime (the `base` service anchor), so "running the dev image" always requires a local checkout of the repo, not just a pulled image.

`docs/guides/navi/extending-navi.md` mentions this image only in passing, as the base the extension example mounts onto. The unrelated `dev/` folder (dev backend/frontend + Tent reverse proxies used to exercise Navi as a cache-warmer target) is already documented separately in `docs/agents/dev-app.md` / `docs/agents/dev-proxy.md`, and is not the subject of this guide.

## Problem
Someone wanting to try Navi locally, or develop against a non-production build, currently has to piece the workflow together from the root `README.md` Development section, the `Makefile`, and `docker-compose.yml` — there is no single `docs/guides/navi/` page for it, unlike the four documented production options.

## Solution
Add a new guide under `docs/guides/navi/` (e.g. `option-e-development-image.md`), mirroring the structure of the existing `option-*` guides:

1. **What it is / when to use it** — the `navi:dev` image, for local trial/dev vs. the production options; note it requires a repo checkout (no bundled app code, unlike production).
2. **Standalone run** (primary path) — `make build-dev`, then `docker run` mounting `./source`, `./worker`, and `docker_volumes/config` (mirroring the `base` service in `docker-compose.yml`) with your own/default config, no extension example required.
3. **`navi_extensions_app` subsection** — the Compose service that runs this same image with extensions enabled (port 3040), which requires first building `examples/navi-orders-extension`; cross-link to `extending-navi.md` for the extensions workflow itself rather than re-documenting it.
4. **One-line cross-reference** to the unrelated `navi_app` / `make dev` shell (same base image, used for running tests/lint — not a way to serve Navi), pointing at the README's Development section.
5. **Ports/routes it exposes** for each path above.
6. A short note distinguishing this guide's subject from `dev/` (the separate sample-backend + proxy stack), already documented in `docs/agents/dev-app.md` / `docs/agents/dev-proxy.md`.

Cross-link the new guide from `docs/guides/how_to_use_navi.md`'s option list and from `extending-navi.md` where the dev image is already mentioned in passing.

## Benefits
- Gives new contributors and evaluators a single, discoverable page for trying Navi locally without a production setup
- Keeps the `option-*` guides in `docs/guides/navi/` complete and consistent
- Reduces the need to reverse-engineer the workflow from the `Makefile`/`docker-compose.yml`
