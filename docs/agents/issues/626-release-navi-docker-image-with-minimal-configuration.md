# Issue: Release navi docker image with minimal configuration

## Description

The production Docker image (built from `dockerfiles/production_navi_hey/Dockerfile`) currently ships with no configuration at all — it just installs `navi-hey` globally via npm and runs it. Anyone running the image must mount their own full YAML config just to get anything working, including the web monitoring UI.

This issue packs a `config/` folder of production-ready, minimal configurations into the image, starting with a `web` one that exposes the monitoring web server out of the box on port 3000. Every setting in that config is extracted into a Dockerfile `ENV` variable so it's overridable at `docker run`/compose time without editing or rebuilding the image, and the config file to use is itself selectable via an env var — so future configs (beyond `web`) can be added and picked the same way.

## Problem

- There is no way to get a working Navi instance out of the box — every user must author and mount a full config file, even just to see the web UI.
- Nothing in a packed config is overridable without editing/rebuilding the image, since no settings are extracted to environment variables.
- There's no established naming/selection convention for shipping more than one production-ready config in the same image.
- The Dockerfile/docker-compose surface is currently treated as shared infrastructure with no dedicated owner, even though this issue requires heavy changes to it.
- `README.md`, `DOCKERHUB_DESCRIPTION.md`, and `docs/HOW_TO_USE_NAVI.md` (and its sub-pages) all currently document only the "bring your own full config" flow.

## Expected Behavior

- `docker run -p 3000:3000 darthjee/navi-hey:latest` works with zero volume mounts: the web monitoring UI comes up immediately on port 3000 and stays up indefinitely (does not auto-shutdown when idle).
- The image ships with no `resources:`/`clients:` baked in — those are expected to be added afterwards through the Navi client/API, not through the packed config.
- Every setting in the packed config is overridable at `docker run`/compose time via an env var, without editing or rebuilding the image.
- Which config file the image runs is itself controlled by an env var, so additional configs can be added later and selected the same way.

## Solution

### config/ folder & naming

Precedent already in the repo:

- `dockerfiles/demo_navi_hey/` ships a config into the image via `COPY navi-config.yml /home/node/app/config/navi_config.yml`, and that YAML already uses `$VAR` placeholders (e.g. `$WORKERS`, `$BASE_URL`) which `navi-hey` resolves from the environment at runtime — no extra scripting needed.
- `source/lib/services/ArgumentsParser.js` defines `DEFAULT_CONFIG_FILE = 'config/navi_config.yml'` and a `-c/--config` CLI flag to point `navi-hey` at a different file.

Decided:

- The packed config files live under `config/` in the image (e.g. `dockerfiles/production_navi_hey/config/`, copied to `/home/node/app/config/`), one file per configuration purpose. The first one is `config/web.yml`. Future configs follow the same descriptive naming, e.g. `config/web_and_workers.yml`.
- The image's default `CMD` reads the config path from an env var rather than staying a bare `navi-hey`: `CMD navi-hey -c $NAVI_CONFIG`. See "Config selection env var" below for `NAVI_CONFIG` itself.

### web config content

`config/web.yml` contains a `web:` section and a `workers:` section. No `resources:`/`clients:` — those get added later via the Navi client/API, not baked into the image.

`web:` (fields per `source/lib/models/configs/WebConfig.js`):

| field | env var | default |
|---|---|---|
| `port` | `$PORT` | `3000` |
| `logs_page_size` | `$LOGS_PAGE_SIZE` | `20` (WebConfig's own built-in default) |
| `enable_shutdown` | `$ENABLE_SHUTDOWN` | `false` |
| `autostart` | `$AUTOSTART` | `true` |
| `idle_timeout` | `$IDLE_TIMEOUT` | `0` (disables auto-shutdown — this is the "does not die when idle" requirement, made explicit/overridable instead of relying on WebConfig's implicit default) |
| `links` | — | omitted (array, doesn't reduce to a single scalar env var; can be added later once resources exist) |
| `api.token` | `$API_TOKEN` | empty/disabled |

`workers:` (mirrors the `dockerfiles/demo_navi_hey/` pattern, fields per `source/lib/models/configs/WorkersConfig.js`):

| field | env var | default |
|---|---|---|
| `quantity` | `$WORKERS` | `1` |
| `retry_cooldown` | `$RETRY_COOLDOWN` | `2000` |
| `sleep` | `$WORKERS_SLEEP` | `500` |
| `max-retries` | `$MAX_RETRIES` | `3` |

### Config selection env var

`NAVI_CONFIG` holds the **full relative path** to the config file (not just a bare name) — e.g. `ENV NAVI_CONFIG=./config/web.yml` — so anyone overriding it can point at a different folder, a different file extension (`.yaml`), or an absolute path, not just swap a name into a fixed pattern. `CMD` becomes `navi-hey -c $NAVI_CONFIG`.

### Env var extraction mechanism

All config-value variables (`NAVI_CONFIG`, `PORT`, `LOGS_PAGE_SIZE`, `ENABLE_SHUTDOWN`, `AUTOSTART`, `IDLE_TIMEOUT`, `API_TOKEN`, `WORKERS`, `RETRY_COOLDOWN`, `WORKERS_SLEEP`, `MAX_RETRIES`) are declared with `ENV` (not `ARG`) in the Dockerfile, each with its default value baked in. `ARG` is build-time-only — it wouldn't satisfy "anyone using the docker image can use it setting the variables" at `docker run`/compose time. This keeps the existing `ARG NAVI_VERSION` unchanged, since that one legitimately only matters at build time (which `navi-hey` version gets `npm install -g`'d).

### New docker agent

A new `docker` specialist agent (`.claude/agents/docker.md`) is created to own `dockerfiles/` and root `docker-compose.yml`, carved out of `architect`'s current "shared infrastructure not owned by a single specialist" bucket. `docker_volumes/` stays with `architect` — it's runtime bind-mount data (config, node_modules cache), not something authored/reviewed like a Dockerfile.

Follow-up work when implementing: update `architect`'s "Your scope" and "Specialist agents" table in `.claude/agents/architect.md`, and add the new agent's row there — same pattern as the existing `engine`/`frontend`/`dev`/`navi-client`/`docs` agents.

### Docs updates

All three doc files named in the issue are owned by the existing `docs` agent (`.claude/agents/docs.md` already lists `README.md`, `DOCKERHUB_DESCRIPTION.md`, `docs/HOW_TO_USE_NAVI.md`) — no new docs agent needed.

- **`README.md`** and **`DOCKERHUB_DESCRIPTION.md`**: both currently lead their "Quick Start" with a config-mounting example (`-v /path/to/your/config.yml:...`). Replace/lead with the new zero-config quick start instead:
  ```bash
  docker run -p 3000:3000 darthjee/navi-hey:latest
  ```
  (web UI up immediately, no mount needed). Keep the existing full-config example as a secondary "Custom Configuration" section for users who want to bring their own YAML. Add a table of the new env vars (`NAVI_CONFIG`, `PORT`, `LOGS_PAGE_SIZE`, `ENABLE_SHUTDOWN`, `AUTOSTART`, `IDLE_TIMEOUT`, `API_TOKEN`, `WORKERS`, `RETRY_COOLDOWN`, `WORKERS_SLEEP`, `MAX_RETRIES`) with their defaults.
- **`docs/HOW_TO_USE_NAVI.md`** itself is just a table of contents — no change needed there. Its linked sub-pages do need updates:
  - **`docs/navi/option-a-docker-image.md`**: note that the image now ships a working default config out of the box; still keep the config-mounting CI examples since CI usage generally needs a custom config regardless.
  - **`docs/navi/reference.md`**: document `NAVI_CONFIG` and the production image's env var table (same set as above).

Aside (not in scope for this issue, flagging for awareness): `README.md`, `DOCKERHUB_DESCRIPTION.md`, and `docs/navi/option-a-docker-image.md` currently show `node navi.js config/navi_config.yml` as the run command inside the container, which predates `navi-hey` becoming a global npm bin (the image's actual `CMD` is `navi-hey`, and `reference.md`'s own CLI flags table documents `-c/--config`). Pre-existing inconsistency, unrelated to this issue.

## Benefits

- Dramatically better onboarding: a single `docker run` gets a working, browsable Navi instance with no config authoring required.
- Full runtime configurability without rebuilding the image — every setting the packed config exposes is env-var overridable.
- Establishes a clear, repeatable pattern (`config/<name>.yml` + `NAVI_CONFIG`) for shipping additional production-ready configs in the future.
- Clear ownership of Dockerfile/docker-compose changes via the new `docker` agent, instead of falling into the shared "architect" bucket.
- Documentation (README, Docker Hub description, integration guide) stays consistent with the new zero-config default.
