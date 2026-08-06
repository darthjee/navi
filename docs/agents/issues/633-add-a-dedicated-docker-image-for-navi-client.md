# Issue: Add a dedicated docker image for navi client

## Description

Navi already publishes a dedicated production Docker image for the application (`darthjee/navi-hey`), built from `dockerfiles/production_navi_hey/Dockerfile` and released automatically on every `\d+\.\d+\.\d+` version tag. The Node.js client package (`navi-hey-client`) is published to npm separately (triggered by `client-\d+\.\d+\.\d+` tags) and exposes both a library and a `navi-client` CLI, but has no Docker image counterpart.

The motivating use case: other repositories' CI pipelines want to warm the cache of an already-running Navi instance by calling `navi-client` — without installing Node.js/npm in their CI environment purely for that, and without building a throwaway container of their own just to run the client.

## Problem

Without a published client image, every CI consumer that wants to run `navi-client` has to either build their own Docker image around `navi-hey-client`, or install Node.js in their CI environment purely to run one CLI. Both are unnecessary setup for what should be a one-line `docker run`/CircleCI-executor-image usage.

## Expected Behavior

- Tagging a client release (`client-x.y.z`, the same tag that already triggers the npm publish) also builds and pushes `darthjee/navi-hey-client:x.y.z` and `darthjee/navi-hey-client:latest` to Docker Hub — mirroring how `\d+\.\d+\.\d+` tags already release `darthjee/navi-hey`.
- The image works directly for both real usage patterns:
  - Plain `docker run --rm darthjee/navi-hey-client:latest navi-client --base-url ... --token ... --action ...`.
  - Declared as a CircleCI primary `docker:` executor image, with `navi-client ...` called from a `run:` step (no Docker-in-Docker, no extra install step).
- `docs/guides/navi-client/installation.md` documents the Docker option (including both usage patterns above), a Docker Hub description page exists for the image, and `README.md`'s Makefile commands table lists the new `make build-client` target.

## Solution

### Image strategy: dedicated vs. bundled

The client ships as its **own** Docker image (`darthjee/navi-hey-client`), not bundled into the `darthjee/navi-hey` application image.

Rationale:
- The primary consumer is CI in *other* repos that just wants to run `navi-client ...` against an already-running Navi instance — pulling the full app image would be unnecessarily heavy (server, workers, config) and would default to the wrong command (boots a server instead of running the client), forcing every consumer to override it.
- A dedicated image gives a correct-by-default command (`navi-client`), a much smaller pull, and an independent release cadence that matches how `navi-hey-client` is already versioned separately from `navi-hey` on npm.
- This also matches the project's existing pattern of one image per role (`dev_app`, `dev_frontend`, `production_navi_hey`, …) rather than a do-everything image.

### Dockerfile contents & base

```dockerfile
FROM darthjee/production_node:0.2.1

ARG CLIENT_VERSION=latest

ENV NODE_ENV=production

RUN npm install -g navi-hey-client@${CLIENT_VERSION}

USER node

CMD navi-client
```

at `dockerfiles/production_navi_client/Dockerfile` (mirrors `production_navi_hey` naming).

- **Same base image** as the app, `darthjee/production_node:0.2.1`, for consistency (non-root `node` user, same node version).
- **`CMD`, not `ENTRYPOINT`** — mirrors the app image's `CMD navi-hey -c $NAVI_CONFIG` exactly. This was decided after checking the actual intended usage: the image is meant to be declared as a CircleCI primary `docker:` executor image (`run: navi-client --base-url ... --action ...` in a step), and CircleCI's docker executor **ignores both `ENTRYPOINT` and `CMD` for the primary container** when no override is set in `config.yml` — confirmed via CircleCI's own docs, quoted in [a CircleCI community thread](https://discuss.circleci.com/t/make-circle-respect-docker-images-entrypoint/26050): *"For primary container (listed first in the list) if no `command` is specified then `command` and image entrypoint will be ignored."* Each `run:` step executes as its own shell command inside the container regardless of the Dockerfile's `CMD`/`ENTRYPOINT`. This matches the existing precedent in `docs/guides/navi/option-c-circleci-executor.md`, where `darthjee/navi-hey` is used as a primary image and its `run:` step spells out `navi-hey --config ...` explicitly, never relying on the image's default `CMD`. Since neither the CircleCI-primary-image path nor this project's own `docker run` doc examples (which always spell out the full command explicitly, e.g. `option-a-docker-image.md`) benefit from `ENTRYPOINT`'s implicit-args behavior, `CMD` was chosen instead — it keeps interactive debugging simple (`docker run --rm -it image /bin/bash` works with no `--entrypoint` override) at no real cost.
- **No baked-in `ENV` defaults** — unlike the app image's ~10 `ENV` lines, the client CLI has no env-var fallback today (`clients/node/lib/CliArgumentsParser.js` only reads flags via `parseArgs`), so all configuration is passed as explicit `docker run`/`run:` step arguments, consistent with today's `npx navi-client --base-url ...` usage in the docs.
- **Build arg** `CLIENT_VERSION` (mirrors `NAVI_VERSION`), matching the tagging scheme below.

### Release trigger & CI wiring

Reuse the existing `client-x.y.z` git tag (already used by `check-client-version-tag` / `npm-publish-client`) as the single trigger for both the npm publish and the Docker image publish — no new tag pattern needed. This matches "only when there is a new version of the client" and mirrors the app's release shape (`build-and-release` → `make release TAG=...` → `update-description`, all gated on the version tag).

Concretely:

1. **`build-and-release-client`** (new CircleCI job, `machine: true`)
   - `requires: [npm-publish-client]` — mirrors `build-and-release` requiring only `[npm-publish]`, since `npm-publish-client` already transitively gates on `jasmine-client`/`checks-client`.
   - `filters.tags: only: /client-\d+\.\d+\.\d+/`, `branches.ignore: /.*/` — same filter as `npm-publish-client`.
   - Runs `make release-client TAG=$(echo $CIRCLE_TAG | sed 's/^client-//')`, stripping the `client-` prefix the same way `scripts/check_client_tag_version.sh` already does.

2. **New Makefile targets** `build-client`, `build-image-client`, `release-client`, mirroring `build` / `build-image` / `release`, parametrized on a new `DOCKERFILE_PROD_CLIENT` and `CLIENT_IMAGE := darthjee/navi-hey-client`.

3. **`update-description-client`** (new CircleCI job), mirroring `update-description`:
   - `requires: [build-and-release-client]`, same tag filter.
   - Runs a new `scripts/update-description-client.sh` pushing the client's Docker Hub description file to `darthjee/navi-hey-client`.

4. Wire all three new jobs into the `test-and-release` workflow's job list.

Neither the app image nor the client image is built/pushed on regular commits or PRs — only on release tags — so this preserves that existing behavior with no new gap.

Credentials: reuse the existing `DOCKER_HUB_USERNAME` / `DOCKER_HUB_PASSWORD` and CircleCI context already used for the app's Docker release — no new credentials needed.

### Image tagging scheme

Mirror the app's tagging exactly.

- The client Dockerfile takes a build arg (`CLIENT_VERSION`), used for `npm install -g navi-hey-client@${CLIENT_VERSION}` — same shape as `NAVI_VERSION` in `production_navi_hey/Dockerfile`.
- Both a specific-version tag and a floating `:latest` are pushed: `darthjee/navi-hey-client:0.1.0` and `darthjee/navi-hey-client:latest` — same as `darthjee/navi-hey:$(TAG)` + `:latest`.
- The version comes from the stripped `client-x.y.z` git tag (`CIRCLE_TAG` minus the `client-` prefix), the same value already validated against `clients/node/package.json` by `check_client_tag_version.sh` — so git tag, npm version, and Docker tag stay in lockstep by construction.
- `:latest` stays a floating tag, same tradeoff the app already accepts: it's not reproducible, but the consumer decides whether to pull `:latest` or pin an exact version — no extra guidance/enforcement beyond what the app image already gets.

### How-to-use documentation update

Add a **"Docker Image"** section to `docs/guides/navi-client/installation.md`, alongside the existing npm/`npx` section — Docker is just another zero-install way to get `navi-client` running, so it belongs with the rest of the installation options rather than on a new page.

The section covers:
- Link to the `darthjee/navi-hey-client` image on Docker Hub.
- Note that the image's default `CMD` is `navi-client` itself, so `docker run --rm darthjee/navi-hey-client:latest --base-url ... --token ... --action engine-stop` works directly with no entrypoint override — unlike the app image, where the default `CMD` starts the server.
- CI examples for both **GitHub Actions and CircleCI**, mirroring the pair already shown in `docs/guides/navi/option-a-docker-image.md`, since "warm cache from CI" is the actual driving use case for this issue.
- The CircleCI example mirrors `docs/guides/navi/option-c-circleci-executor.md` — declaring `darthjee/navi-hey-client:latest` directly as the job's `docker:` executor image and calling `navi-client ...` from a `run:` step, rather than `docker run` + `setup_remote_docker`. This is the primary real-world usage pattern (files checked out by the job are directly available to the client, no Docker-in-Docker).

Additionally, `README.md`'s "Available Makefile commands" table (`README.md:311-319`) gets a new row for `make build-client`, mirroring the existing `make build` row, for discoverability/consistency. The rest of the root README stays app-focused — full client install/usage documentation continues to live in `clients/node/README.md` and `docs/guides/navi-client/`, as it does today.

### Docker Hub description file

- **File**: `DOCKERHUB_DESCRIPTION_CLIENT.md` at repo root — mirrors `DOCKERHUB_DESCRIPTION.md`, naming consistent with `CLIENT_IMAGE`/`DOCKERFILE_PROD_CLIENT`/`client-x.y.z` already used elsewhere in this issue.
- **Script**: `scripts/update-description-client.sh`, mirroring `scripts/update-description.sh`:
  ```sh
  /bin/sh /home/scripts/sbin/docker_hub.sh login_and_push_description darthjee/navi-hey-client DOCKERHUB_DESCRIPTION_CLIENT.md
  ```
  (this is the script referenced above in the "Release trigger & CI wiring" section's `update-description-client` job.)
- **Content**, adapting `clients/node/README.md` to the Docker Hub context the same way `DOCKERHUB_DESCRIPTION.md` adapts the app's README/docs:
  - Same repo-wide badges (Codacy, CircleCI) as `DOCKERHUB_DESCRIPTION.md` — these are repo-level, not per-package, so reusable as-is.
  - **Overview**: what `navi-hey-client` is (thin wrapper over Navi's `/api/*` namespace).
  - **Quick Start**: `docker run --rm darthjee/navi-hey-client:latest navi-client --base-url ... --token ... --action engine-stop` (explicit command, since the image uses `CMD` not `ENTRYPOINT`), plus the CircleCI-primary-image usage example (the real driving use case), mirroring `option-c-circleci-executor.md`.
  - **CLI options table** (`--base-url`, `--token`, `--action`, `--payload`), same as the client README's table.
  - **Source & Documentation**: link to the GitHub repo and to `docs/guides/HOW_TO_USE_NAVI-CLIENT.md`.

## Benefits

- CI in other repos gets a small, purpose-built image with a correct default command — no Node.js install, no throwaway container build, no entrypoint override.
- Release cadence for the client image stays independent of the app image, matching how `navi-hey-client` is already versioned separately on npm.
- Consistent with the project's existing per-role image pattern (`dev_app`, `dev_frontend`, `production_navi_hey`, …), and reuses existing CI credentials, scripts, and doc structure almost entirely, keeping the addition low-risk.
