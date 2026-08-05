# Plan: Release navi docker image with minimal configuration

Issue: [626-release-navi-docker-image-with-minimal-configuration.md](../../issues/626-release-navi-docker-image-with-minimal-configuration.md)

## Overview

Pack a `config/web.yml` into `dockerfiles/production_navi_hey/`, copy it into the production image, and switch the image's default `CMD` to run it via a selectable, fully env-var-overridable configuration. Every setting the packed config exposes becomes a Dockerfile `ENV` (never `ARG`, so it's overridable at `docker run`/compose time without a rebuild), and the config file to load is itself controlled by `NAVI_CONFIG`. Carve a new `docker` specialist agent out of `architect`'s scope for `dockerfiles/` + `docker-compose.yml`, and update the user-facing docs (owned by the `docs` agent) to lead with the new zero-config quick start.

No `source/` changes are needed — `WebConfig` (`source/lib/models/configs/WebConfig.js`) and `WorkersConfig` (`source/lib/models/configs/WorkersConfig.js`) already support every field this plan exposes as an env var.

## Context

- `dockerfiles/production_navi_hey/Dockerfile` currently just does `RUN npm install -g navi-hey@${NAVI_VERSION}` and `CMD "navi-hey"` — no packed config, no env vars, `navi-hey` falls back to `DEFAULT_CONFIG_FILE = 'config/navi_config.yml'` (`source/lib/services/ArgumentsParser.js`) which doesn't exist in the image, so it errors out with zero configuration.
- `dockerfiles/demo_navi_hey/` is the existing precedent for packing a config into an image (`COPY navi-config.yml /home/node/app/config/navi_config.yml`) and for using `$VAR` placeholders resolved by `navi-hey` at runtime (env var substitution is a built-in `navi-hey` feature, not something this plan needs to implement).
- `Makefile`'s `build-image`/`release` targets already pass `--build-arg NAVI_VERSION=$(TAG)` — that `ARG` is unrelated to this plan's `ENV`s and stays untouched.
- Full field/env-var/default decisions were already settled during issue refinement — see the issue file's "Solution" section for the authoritative tables. This plan does not re-derive them, only sequences the implementation.

## Implementation Steps

### Step 1 — Create the `docker` specialist agent

Add `.claude/agents/docker.md`, modeled on the existing specialist agent files (see `.claude/agents/dev.md` for the shape: frontmatter with `name`/`description`/`tools`, a "Your scope" section, stack/commands, conventions). Scope:

- `dockerfiles/` — all Dockerfiles (dev, demo, production, etc.)
- `docker-compose.yml` (root)
- Explicitly out of scope: `docker_volumes/` (runtime bind-mount data, stays with `architect`), and anything under `source/`, `frontend/`, `dev/`, `clients/node/` (owned by their respective specialists).

Then update `.claude/agents/architect.md`:
- Remove `dockerfiles/` from architect's "Your scope" bullet list (keep `docker_volumes/`, `scripts/`).
- Add a `docker` row to the "Specialist agents" table, in the same format as the existing rows.

This step has no dependency on Steps 2–3 and can be done first or in parallel with them.

### Step 2 — Pack `config/web.yml` and update the production Dockerfile

Create `dockerfiles/production_navi_hey/config/web.yml`:

```yaml
web:
  port: $PORT
  logs_page_size: $LOGS_PAGE_SIZE
  enable_shutdown: $ENABLE_SHUTDOWN
  autostart: $AUTOSTART
  idle_timeout: $IDLE_TIMEOUT
  api:
    token: $API_TOKEN
workers:
  quantity: $WORKERS
  retry_cooldown: $RETRY_COOLDOWN
  sleep: $WORKERS_SLEEP
  max-retries: $MAX_RETRIES
resources: {}
clients: {}
```

No resource/client *definitions* baked in — per the issue, those are added later through the Navi client/API, not baked into the image. The empty `resources: {}`/`clients: {}` keys themselves are still required: verified against the published `navi-hey@1.5.1` at implementation time — `NamespaceMapBuilder` (`source/lib/services/NamespaceMapBuilder.js`) sets `strict = files.length === 1`, so a single, `include:`-less config file (like this one) is parsed in strict mode regardless of `ConfigLoader`'s own `strict: false` (which only governs the entry file's `workers`/`web`/`log`/`failure` extraction, not `NamespaceMapBuilder`'s resource/client loading) — `MissingResourceConfig`/`MissingClientsConfig` is thrown if either top-level key is absent, even though an empty map is otherwise accepted.

Update `dockerfiles/production_navi_hey/Dockerfile`:

```dockerfile
FROM darthjee/production_node:0.2.1

ARG NAVI_VERSION=latest

ENV NODE_ENV=production

ENV NAVI_CONFIG=./config/web.yml
ENV PORT=3000
ENV LOGS_PAGE_SIZE=20
ENV ENABLE_SHUTDOWN=false
ENV AUTOSTART=true
ENV IDLE_TIMEOUT=0
ENV API_TOKEN=
ENV WORKERS=1
ENV RETRY_COOLDOWN=2000
ENV WORKERS_SLEEP=500
ENV MAX_RETRIES=3

RUN npm install -g navi-hey@${NAVI_VERSION}

COPY dockerfiles/production_navi_hey/config/web.yml /home/node/app/config/web.yml

USER node

CMD navi-hey -c $NAVI_CONFIG
```

Notes:
- `ARG NAVI_VERSION` is unchanged (build-time only, controls the installed npm version).
- `ENV NODE_ENV=production` is unchanged and unrelated to config values.
- `NAVI_CONFIG` holds a full relative path (`./config/web.yml`), not a bare name, so overriding it can point at a different folder/extension/absolute path (see issue's "Config selection env var" section for the rationale).
- `CMD` uses shell form (as the existing `CMD "navi-hey"` already does) so `$NAVI_CONFIG` is resolved by the shell at container start, not baked in at build time.
- `API_TOKEN` defaults to empty. Verified against `SecuredRequestHandler#authorize()` (`source/lib/server/SecuredRequestHandler.js`): it rejects every `/api/*` request when the configured token is falsy (`!this.#token`), and `WebConfig` sets `apiToken = api?.token ?? null` — an empty string is falsy, so `api: { token: '' }` behaves identically to omitting `api:` entirely (all `/api/*` requests rejected "by design"). Safe to always emit the `api:` block in `config/web.yml`.
- `COPY`'s source path is `dockerfiles/production_navi_hey/config/web.yml`, not `config/web.yml` — `make build`/`make build-image`/`make release` (`Makefile`) all invoke `docker build -f dockerfiles/production_navi_hey/Dockerfile .`, i.e. the build context is the repo root, not the Dockerfile's own directory, so `COPY` sources must be given relative to the repo root.

### Step 3 — Verify the image builds and runs zero-config

```bash
make build
docker run --rm -p 3000:3000 darthjee/navi-hey:latest
```

Then, in a second terminal, confirm the web UI responds (e.g. `curl -sf http://localhost:3000/` or open it in a browser) and that the container does not exit on its own after a period of inactivity (validates `IDLE_TIMEOUT=0`). Also spot-check an override, e.g.:

```bash
docker run --rm -p 8080:8080 -e PORT=8080 darthjee/navi-hey:latest
```

### Step 4 — Documentation (owned by the `docs` agent)

Dispatch to `docs` once Steps 2–3 have a working image to document against:

- **`README.md`** and **`DOCKERHUB_DESCRIPTION.md`**: replace/lead the existing "Quick Start" (currently `docker run --rm -v /path/to/your/config.yml:/home/node/app/config/navi_config.yml darthjee/navi-hey:latest node navi.js config/navi_config.yml`) with:
  ```bash
  docker run -p 3000:3000 darthjee/navi-hey:latest
  ```
  Keep the existing full-config example as a secondary "Custom Configuration" section. Add a table documenting all new env vars (`NAVI_CONFIG`, `PORT`, `LOGS_PAGE_SIZE`, `ENABLE_SHUTDOWN`, `AUTOSTART`, `IDLE_TIMEOUT`, `API_TOKEN`, `WORKERS`, `RETRY_COOLDOWN`, `WORKERS_SLEEP`, `MAX_RETRIES`) with their defaults.
- **`docs/HOW_TO_USE_NAVI.md`**: no change (it's a table of contents only).
- **`docs/navi/option-a-docker-image.md`**: add a note that the image now ships a working default config out of the box; keep the config-mounting CI examples as-is (CI usage generally needs a custom config regardless).
- **`docs/navi/reference.md`**: document `NAVI_CONFIG` and the same env var table as above.

Out of scope for this issue (flag but do not fix): `README.md`, `DOCKERHUB_DESCRIPTION.md`, and `docs/navi/option-a-docker-image.md` currently show `node navi.js config/navi_config.yml` as the in-container run command, which predates `navi-hey` becoming a global npm bin. Leave this pre-existing inconsistency alone unless explicitly asked to fix it.

## Files to Change

- `.claude/agents/docker.md` — new specialist agent (`dockerfiles/`, `docker-compose.yml`)
- `.claude/agents/architect.md` — remove `dockerfiles/` from scope, add `docker` to the specialist table
- `dockerfiles/production_navi_hey/config/web.yml` — new packed config
- `dockerfiles/production_navi_hey/Dockerfile` — add `ENV` vars, `COPY` the config, switch `CMD`
- `README.md` — new zero-config quick start + env var table (docs agent)
- `DOCKERHUB_DESCRIPTION.md` — same (docs agent)
- `docs/navi/option-a-docker-image.md` — note default config ships out of the box (docs agent)
- `docs/navi/reference.md` — document `NAVI_CONFIG` + env var table (docs agent)

## CI Checks

No CI job builds/tests the production Dockerfile on branches or PRs — `.circleci/config.yml`'s `build-and-release` job (`make release TAG=${CIRCLE_TAG:-latest}`) only runs on version tags (`requires: [npm-publish]`, tag-filtered), and it also pushes to Docker Hub, so it isn't something to run for verification. Verify locally instead:
- `dockerfiles/production_navi_hey/`: `make build` then `docker run --rm -p 3000:3000 darthjee/navi-hey:latest` (see Step 3).
- `docs/*`, `README.md`, `DOCKERHUB_DESCRIPTION.md`: no dedicated lint job; proofread for consistency across the three doc locations per the `docs` agent's own conventions.

## Notes

- `links` is intentionally omitted from `config/web.yml` (doesn't reduce to a single scalar env var) — not a gap to fill in this issue.
- This plan does not touch `source/`, `frontend/`, `dev/`, or `clients/node/` — no changes needed there.
