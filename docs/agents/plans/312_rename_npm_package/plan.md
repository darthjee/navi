# Plan: Rename npm Package

## Overview
Rename the npm package from `navi` to `navi-hey` so that the package can be published to the npm registry, and update the production Docker image name to stay consistent.

## Context
The npm registry already has a package named `navi`, which blocks publishing the Navi project under that name. The package must be renamed to `navi-hey`. The Docker production image (published to Docker Hub as `darthjee/navi`) should also be updated to `darthjee/navi-hey` for consistency.

## Implementation Steps

### Step 1 — Rename the npm package in `package.json`
Update `source/package.json`:
- Change `"name": "navi"` → `"name": "navi-hey"`.
- Update the `"bin"` key from `"navi"` to `"navi-hey"` so the installed CLI command matches the package name.

### Step 2 — Update the production Docker image name
Update `Makefile`:
- Change `PROD_IMAGE := darthjee/navi` → `PROD_IMAGE := darthjee/navi-hey`.
This ensures `make build` tags the production image as `darthjee/navi-hey`.

### Step 3 — Verify CI pipeline
The `.circleci/config.yml` `npm-publish` job runs `cd source; npm publish --access public`, which picks the package name directly from `package.json`. No change to the CI config is needed for the npm rename — the updated `package.json` is sufficient.
If the Docker Hub push job also references the image name explicitly, update it to `darthjee/navi-hey`.

## Files to Change
- `source/package.json` — rename `"name"` field and `"bin"` key from `navi` to `navi-hey`
- `Makefile` — update `PROD_IMAGE` from `darthjee/navi` to `darthjee/navi-hey`

## Notes
- The Docker Compose service names (`navi_app`, `navi_tests`, etc.) are internal local names and do **not** need to change.
- The CLI binary name (`navi` → `navi-hey`) changes what users type after installing the package globally. This is a breaking change for existing users but is necessary given the package rename.
- Any documentation (README, docs) that references `npm install navi` or `npx navi` should be updated to `npm install navi-hey` / `npx navi-hey`.
