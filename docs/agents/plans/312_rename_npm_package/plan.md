# Plan: Rename npm Package

## Overview
Rename the npm package from `navi` to `navi-hey` so that the package can be published to the npm registry, update the production Docker Hub image name, rename the Dockerfile directories for consistency, and update all user-facing documentation to reflect the new names.

## Context
The npm registry already has a package named `navi`, which blocks publishing the Navi project under that name. The package must be renamed to `navi-hey`. The Docker production image (published to Docker Hub as `darthjee/navi`) is updated to `darthjee/navi-hey` for consistency. Internal Docker Compose service names, container names, and local image tags (`navi:dev`, `navi_app:dev`) remain unchanged.

## Implementation Steps

### Step 1 — Rename the npm package in `package.json`
Update `source/package.json`:
- Change `"name": "navi"` → `"name": "navi-hey"`.
- Update the `"bin"` key from `"navi"` to `"navi-hey"` so the installed CLI command is `navi-hey`.
- The entrypoint file `source/bin/navi.js` is not renamed — only the exposed command name changes.

### Step 2 — Rename the Dockerfile directories
Rename the two directories that contain "navi" in their name:
- `dockerfiles/dev_navi/` → `dockerfiles/dev_navi_hey/`
- `dockerfiles/production_navi/` → `dockerfiles/production_navi_hey/`

### Step 3 — Update the production Dockerfile
Update `dockerfiles/production_navi_hey/Dockerfile` (after the rename in Step 2):
- Change `RUN npm install -g navi@${NAVI_VERSION}` → `RUN npm install -g navi-hey@${NAVI_VERSION}`.
This is critical: the production image installs the npm package by name at build time.

### Step 4 — Update the Makefile
- Change `DOCKERFILE_DEV ?= dockerfiles/dev_navi/Dockerfile` → `dockerfiles/dev_navi_hey/Dockerfile`.
- Change `DOCKERFILE_PROD ?= dockerfiles/production_navi/Dockerfile` → `dockerfiles/production_navi_hey/Dockerfile`.
- Change `PROD_IMAGE := darthjee/navi` → `PROD_IMAGE := darthjee/navi-hey`.
- `PROJECT ?= navi` is left unchanged — it drives local image tags and service names which are not being renamed.

### Step 5 — Update README.md
- `npm install -g navi` → `npm install -g navi-hey`
- `yarn global add navi` → `yarn global add navi-hey`
- `npx navi --config ...` → `npx navi-hey --config ...`
- `navi --config ...` (installed CLI usage) → `navi-hey --config ...`
- `navi:latest` (docker run examples) → `darthjee/navi-hey:latest`

### Step 6 — Update DOCKERHUB_DESCRIPTION.md
Apply the same changes as README.md for Docker Hub-facing content:
- `darthjee/navi:latest` docker run references → `darthjee/navi-hey:latest`

### Step 7 — Update docs/agents/architecture.md
Update the Makefile commands table:
- `make build` description: `navi:latest` → `darthjee/navi-hey:latest`

### Step 8 — Verify CircleCI pipeline
The `.circleci/config.yml` does **not** hardcode any `navi` image names:
- The `build-and-release` job runs `make release TAG=${CIRCLE_TAG:-latest}`, which reads `PROD_IMAGE` from the Makefile.
- The `update-description` job runs `sh scripts/update-description.sh`, which calls `make update-description`, also reading `PROD_IMAGE` from the Makefile.

**No changes needed to `.circleci/config.yml`.**

## Files to Change
- `source/package.json` — rename `"name"` field and `"bin"` key from `navi` to `navi-hey`
- `dockerfiles/dev_navi/` → rename directory to `dockerfiles/dev_navi_hey/`
- `dockerfiles/production_navi/` → rename directory to `dockerfiles/production_navi_hey/`
- `dockerfiles/production_navi_hey/Dockerfile` — update `npm install -g navi` → `npm install -g navi-hey`
- `Makefile` — update `DOCKERFILE_DEV`, `DOCKERFILE_PROD`, and `PROD_IMAGE`
- `README.md` — update npm install/CLI usage and Docker Hub image references
- `DOCKERHUB_DESCRIPTION.md` — update Docker Hub image references in docker run examples
- `docs/agents/architecture.md` — update production image name in Makefile commands table

## Notes
- `docker-compose.yml` is not modified: service names, container names, and local image tags (`navi:dev`, `navi_app:dev`, `navi_frontend:dev`) remain unchanged.
- `PROJECT ?= navi` in the Makefile is not changed, keeping all local dev tooling working without any rebuild or migration.
- The CLI binary name change (`navi` → `navi-hey`) is a breaking change for existing users who have the package installed globally.
- The entrypoint file `source/bin/navi.js` is not renamed.

## CI Checks
Before opening a PR, run the following checks for the folders being modified:
- `source/`: `cd source && yarn lint` (CircleCI job: `checks`)
