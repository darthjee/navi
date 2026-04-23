# Plan: Rename npm Package

## Overview
Rename the npm package from `navi` to `navi-hey` so that the package can be published to the npm registry, and update the production Docker image name and all relevant documentation to stay consistent.

## Context
The npm registry already has a package named `navi`, which blocks publishing the Navi project under that name. The package must be renamed to `navi-hey`. The Docker production image (published to Docker Hub as `darthjee/navi`) should also be updated to `darthjee/navi-hey` for consistency. All user-facing documentation (README, Docker Hub description, and agent docs) must reflect the new names.

## Implementation Steps

### Step 1 — Rename the npm package in `package.json`
Update `source/package.json`:
- Change `"name": "navi"` → `"name": "navi-hey"`.
- Update the `"bin"` key from `"navi"` to `"navi-hey"` so the installed CLI command matches the package name.

### Step 2 — Update the production Docker image name
Update `Makefile`:
- Change `PROD_IMAGE := darthjee/navi` → `PROD_IMAGE := darthjee/navi-hey`.
This ensures `make build`, `make release`, and `make update-description` all use the correct image name.

### Step 3 — Update README.md
Update all npm/CLI usage instructions and Docker Hub image references:
- `npm install -g navi` → `npm install -g navi-hey`
- `yarn global add navi` → `yarn global add navi-hey`
- `npx navi --config ...` → `npx navi-hey --config ...`
- `navi --config ...` (installed CLI usage) → `navi-hey --config ...`
- `darthjee/navi:latest` (docker run examples) → `darthjee/navi-hey:latest`

### Step 4 — Update DOCKERHUB_DESCRIPTION.md
Apply the same changes as README.md for Docker Hub-facing content:
- `darthjee/navi:latest` docker run references → `darthjee/navi-hey:latest`

### Step 5 — Update docs/agents/architecture.md
Update the Makefile commands table entry for `make build`:
- `navi:latest` → `darthjee/navi-hey:latest` (the production image tag).

### Step 6 — Verify CI pipeline
The `.circleci/config.yml` `npm-publish` job runs `cd source; npm publish --access public`, which picks the package name directly from `package.json`. No change to the CI config is needed — the updated `package.json` is sufficient. The `release` job uses `make release TAG=...`, which reads `PROD_IMAGE` from the Makefile and will automatically push `darthjee/navi-hey`.

## Files to Change
- `source/package.json` — rename `"name"` field and `"bin"` key from `navi` to `navi-hey`
- `Makefile` — update `PROD_IMAGE` from `darthjee/navi` to `darthjee/navi-hey`
- `README.md` — update npm install/CLI usage and Docker Hub image references
- `DOCKERHUB_DESCRIPTION.md` — update Docker Hub image references in docker run examples
- `docs/agents/architecture.md` — update production image name in Makefile commands table

## Notes
- Docker Compose service names (`navi_app`, `navi_tests`, `navi_proxy`, etc.) are internal local names and do **not** need to change.
- The local dev image tag (`navi:dev`) is built from `PROJECT ?= navi` in the Makefile and is only used locally — it does not need to change unless the `PROJECT` variable is also renamed.
- The CLI binary name change (`navi` → `navi-hey`) is a breaking change for existing users who have the package installed globally.
- `scripts/update-description.sh` pushes `DOCKERHUB_DESCRIPTION.md` to Docker Hub using `PROD_IMAGE` from the Makefile — no change needed there since it reads from `PROD_IMAGE`.

## CI Checks
Before opening a PR, run the following checks for the folders being modified:
- `source/`: `cd source && yarn lint` (CircleCI job: `checks`)
