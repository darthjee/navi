# Plan: Rename npm Package

## Overview
Rename the npm package from `navi` to `navi-hey` so that the package can be published to the npm registry, and consistently rename all Docker image names, service names, and container names across the project. Update all user-facing documentation to reflect the new names.

## Context
The npm registry already has a package named `navi`, which blocks publishing the Navi project under that name. The package must be renamed to `navi-hey`. Because we are renaming the project's published identity, all Docker image names (local dev images, app images, frontend images, and the production Docker Hub image) must also be updated to `navi-hey`. All internal Docker Compose service and container names follow the same convention and must be updated too.

## Implementation Steps

### Step 1 — Rename the npm package in `package.json`
Update `source/package.json`:
- Change `"name": "navi"` → `"name": "navi-hey"`.
- Update the `"bin"` key from `"navi"` to `"navi-hey"` so the installed CLI command matches the package name.

### Step 2 — Update the production Dockerfile
Update `dockerfiles/production_navi/Dockerfile`:
- Change `RUN npm install -g navi@${NAVI_VERSION}` → `RUN npm install -g navi-hey@${NAVI_VERSION}`.
This is critical: the production image installs the npm package by name at build time.

### Step 3 — Update the Makefile
- Change `PROJECT ?= navi` → `PROJECT ?= navi-hey`.
  This cascades automatically to: `IMAGE` (`navi-hey`), `APP_IMAGE` (`navi-hey_app`), `APP_SERVICE` (`navi-hey_app`), `DEV_SERVICE` (`navi-hey_dev_app`), `TEST_SERVICE` (`navi-hey_tests`).
- Change `PROD_IMAGE := darthjee/navi` → `PROD_IMAGE := darthjee/navi-hey`.
- Fix hardcoded service names that bypass the `PROJECT` variable:
  - `navi_web_proxy` → `navi-hey_web_proxy` (lines `dev` and `dev-app-up` targets)
  - `navi_dev_app` → `navi-hey_dev_app` (line `dev-app-up` target)
  - `navi_proxy` → `navi-hey_proxy` (line `dev-app-up` target)

### Step 4 — Update `docker-compose.yml`
Rename all service names, container names, and image tags:

| Old | New |
|-----|-----|
| `image: navi:dev` | `image: navi-hey:dev` |
| `container_name: navi_build` | `container_name: navi-hey_build` |
| service `navi_app` | `navi-hey_app` |
| service `navi_tests` | `navi-hey_tests` |
| service `navi_proxy` | `navi-hey_proxy` |
| service `navi_dev_app` | `navi-hey_dev_app` |
| `image: navi_app:dev` | `image: navi-hey_app:dev` |
| service `navi_frontend` | `navi-hey_frontend` |
| `image: navi_frontend:dev` | `image: navi-hey_frontend:dev` |
| service `navi_web_proxy` | `navi-hey_web_proxy` |

All `depends_on`, `links`, and internal references must be updated consistently.

### Step 5 — Update README.md
- `npm install -g navi` → `npm install -g navi-hey`
- `yarn global add navi` → `yarn global add navi-hey`
- `npx navi --config ...` → `npx navi-hey --config ...`
- `navi --config ...` (installed CLI usage) → `navi-hey --config ...`
- `navi:latest` (docker run examples) → `darthjee/navi-hey:latest`
- Makefile commands table: update image tag descriptions to match new names.

### Step 6 — Update DOCKERHUB_DESCRIPTION.md
Apply the same changes as README.md for Docker Hub-facing content:
- `darthjee/navi:latest` docker run references → `darthjee/navi-hey:latest`

### Step 7 — Update docs/agents/architecture.md
Update the Makefile commands table:
- `navi:dev` → `navi-hey:dev` (dev image description)
- `navi:latest` → `darthjee/navi-hey:latest` (production image description)

### Step 8 — Verify CircleCI pipeline
The `.circleci/config.yml` does **not** hardcode any `navi` image names:
- All test jobs use `darthjee/circleci_node:0.2.1` (unchanged).
- The `build-and-release` job runs `make release TAG=${CIRCLE_TAG:-latest}`, which reads `PROD_IMAGE` from the Makefile — automatically picks up the rename.
- The `update-description` job runs `sh scripts/update-description.sh` which calls `make update-description`, which also reads `PROD_IMAGE` from the Makefile.

**No changes needed to `.circleci/config.yml`.**

## Files to Change
- `source/package.json` — rename `"name"` field and `"bin"` key from `navi` to `navi-hey`
- `dockerfiles/production_navi/Dockerfile` — update `npm install -g navi` → `npm install -g navi-hey`
- `Makefile` — update `PROJECT`, `PROD_IMAGE`, and hardcoded service name references
- `docker-compose.yml` — rename all service names, container names, and image tags
- `README.md` — update npm install/CLI usage and Docker image references
- `DOCKERHUB_DESCRIPTION.md` — update Docker Hub image references in docker run examples
- `docs/agents/architecture.md` — update image name descriptions in Makefile commands table

## Notes
- The Docker Compose service names use underscores (`navi-hey_app`) while the project name uses a hyphen. Docker Compose supports hyphens in project names and underscores in service names — this is the existing convention and is fine.
- The local dev image `navi:dev` is only used within docker-compose — renaming it does not affect Docker Hub.
- The CLI binary name change (`navi` → `navi-hey`) is a breaking change for existing users who have the package installed globally.
- The `dockerfiles/dev_navi/` and `dockerfiles/production_navi/` directory names also contain "navi" but are internal paths — they do not need to be renamed unless desired for consistency.

## CI Checks
Before opening a PR, run the following checks for the folders being modified:
- `source/`: `cd source && yarn lint` (CircleCI job: `checks`)
