# Plan: Dev Dockerfiles: unpinned apt packages / missing --no-install-recommends

Issue: [846_dev-dockerfiles--unpinned-apt-packages---missing---no-install-recommends.md](../../issues/846-dev-dockerfiles--unpinned-apt-packages---missing---no-install-recommends.md)

## Overview
Four dev Dockerfiles (`dev_app`, `dev_frontend_app`, `dev_frontend`, `dev_navi_hey`) install `rsync` via `apt-get` without pinning a version, and three of them omit `--no-install-recommends`. All four share the same `base` stage, `FROM darthjee/node:0.2.1`, which is Debian 12 (bookworm). This plan pins `rsync` to the current bookworm-main candidate (`3.2.7-1+deb12u6`, verified via `apt-cache policy rsync` inside the base image) and adds `--no-install-recommends` everywhere it's missing.

## Context
Codacy/Hadolint flags:
- `DL3008` (unpinned version) on all four files, line 5.
- `DL3015` (missing `--no-install-recommends`) on `dev_frontend_app` and `dev_navi_hey`, line 5. `dev_app` also lacks the flag but wasn't flagged for `DL3015` in this issue's report — it should still get the flag for consistency, since `dev_frontend` already has it.

A repo-wide grep confirmed these are the only four Dockerfiles under `dockerfiles/` that invoke `apt-get` at all, and that no Dockerfile in this repo currently pins an apt package version — so there's no existing in-repo convention to match, this establishes it.

## Implementation Steps

### Step 1 — Pin `rsync` and add `--no-install-recommends` in all four Dockerfiles
Update each Dockerfile's `apt-get install` line to `apt-get install -y --no-install-recommends rsync=3.2.7-1+deb12u6`:
- `dockerfiles/dev_app/Dockerfile:5` — currently `apt-get install -y rsync`; add both the pin and the flag.
- `dockerfiles/dev_frontend_app/Dockerfile:5` — currently `apt-get install -y rsync`; add both the pin and the flag.
- `dockerfiles/dev_navi_hey/Dockerfile:5` — currently `apt-get install -y rsync`; add both the pin and the flag.
- `dockerfiles/dev_frontend/Dockerfile:6` — currently `apt-get install -y rsync --no-install-recommends`; add the pin only (flag already present); keep the existing multi-line `RUN` formatting.

### Step 2 — Verify the images still build
Build each of the four images locally (e.g. `docker build -f dockerfiles/dev_app/Dockerfile .` and similarly for the other three, or via `docker-compose build` for the corresponding services) to confirm the pinned version resolves against the base image's currently configured apt sources and the build still succeeds.

## Files to Change
- `dockerfiles/dev_app/Dockerfile` — pin `rsync` version, add `--no-install-recommends`.
- `dockerfiles/dev_frontend_app/Dockerfile` — pin `rsync` version, add `--no-install-recommends`.
- `dockerfiles/dev_frontend/Dockerfile` — pin `rsync` version (flag already present).
- `dockerfiles/dev_navi_hey/Dockerfile` — pin `rsync` version, add `--no-install-recommends`.

## Notes
- No local hadolint/lint command exists in this repo (Codacy runs Hadolint on push, not via a local script or CI job) — Step 2's `docker build` is the closest local verification available.
- The pinned version (`3.2.7-1+deb12u6`) is Debian bookworm's current apt-get resolvable candidate as of this plan. If Debian later removes it from the mirrors (e.g. after a further security bump), the pin will need to be bumped in a follow-up — an accepted, expected maintenance cost of pinning.
