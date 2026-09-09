# docs Plan: Docs: add a guide for running Navi's development image

Main plan: [plan.md](plan.md)

## Overview

`docs/guides/navi/` documents four production integration options (A–D) but nothing for running Navi's own `navi:dev` development image locally. Add a new `option-e-development-image.md` guide covering the standalone `docker run` path (the primary "try Navi out" path, since the image bundles no app code and must be run against a repo checkout), the `navi_extensions_app` Compose service (which layers the extensions example on top of the same image), and a short cross-reference to the unrelated `navi_app` / `make dev` test-shell usage — then link it in from `how_to_use_navi.md` and `extending-navi.md`.

## Context

Confirmed via `docker-compose.yml`, `Makefile`, and `dockerfiles/dev_navi_hey/Dockerfile`:

- `navi:dev` (built by `make build-dev` from `dockerfiles/dev_navi_hey/Dockerfile`) only installs dependencies — it has **no `COPY` of application source**. `docker-compose.yml`'s `base` anchor mounts `./source`, `./worker`, `./docker_volumes/config`, and `./docker_volumes/node_modules` into it at runtime. Any "run the dev image" instructions must therefore assume a local repo checkout and replicate those mounts, unlike production Option A's self-contained `docker run darthjee/navi-hey:latest`.
- `navi_extensions_app` (the only Compose service that actually runs this image as an HTTP server outside of a shell, port `3040`) hardcodes volumes onto `examples/navi-orders-extension/config` and `examples/navi-orders-extension/dist` with `NAVI_EXTENSIONS_ENABLED=true`. It cannot be started without first building that example (`cd examples/navi-orders-extension && npm ci && npm run build`), mirroring the `smoke-extensions` Makefile target (minus its smoke test/teardown).
- `navi_app` (same `navi:dev` image, no extensions) runs `tail -f /dev/null` — it never serves HTTP. It exists solely so `make dev` can `exec` an interactive shell into it for `yarn test` / `yarn lint`. It is unrelated to "running" Navi and must not be presented as a way to try Navi out.
- `dev/` (`navi_dev_app`, `navi_dev_frontend`, `navi_proxy`, `navi_web_proxy`) is a **separate** sample target backend + Tent reverse proxies used to exercise Navi's own cache-warming behavior against a controlled dataset — already documented in `docs/agents/dev-app.md` / `docs/agents/dev-proxy.md`. It is not the subject of this guide; the new guide only needs a short note distinguishing the two so readers aren't confused by the overlapping "dev" naming.
- No CI job lints `docs/guides/**` markdown (checked `.circleci/config.yml`), so this plan has no `## CI Checks` section.

User decisions from the discuss-issue dialogue (issue #825):
- Guide covers **both** the standalone `docker run` path and `navi_extensions_app`, standalone first.
- Include a one-line cross-reference to `navi_app` / `make dev` (README's Development section) so the two same-image-but-different-purpose services aren't conflated.

## Steps

- [01 — Write the development-image guide](docs/01-write-development-image-guide.md)
- [02 — Cross-link from how_to_use_navi.md](docs/02-cross-link-how-to-use-navi.md)
- [03 — Cross-link from extending-navi.md](docs/03-cross-link-extending-navi.md)

## Notes

- The dev image's default/exposed port for the standalone run mirrors `navi_app`'s Compose mapping (`3000:3000`) since it's the same image/entrypoint style — verify against `docker-compose.yml` if it drifts before publishing.
- Do not describe `option-e` as a fifth "integration mode" alongside A–D in `how_to_use_navi.md`'s intro paragraph — Options A–D are CI/production integration modes; the dev image is a separate local trial/dev path. Keep it as its own Table-of-Contents entry with a one-sentence pointer, not folded into the "Four integration modes are covered" list.
