# Issue: Dev Dockerfiles: unpinned apt packages / missing --no-install-recommends

## Description
Codacy/Hadolint flags apt-get hygiene issues across all four dev Dockerfiles that install packages via `apt-get` (these are the only Dockerfiles under `dockerfiles/` that call `apt-get` at all):

- `DL3008` — pin versions in `apt-get install` (instead of `apt-get install <package>`, use `apt-get install <package>=<version>`):
  - `dockerfiles/dev_app/Dockerfile:5`
  - `dockerfiles/dev_frontend_app/Dockerfile:5`
  - `dockerfiles/dev_frontend/Dockerfile:5`
  - `dockerfiles/dev_navi_hey/Dockerfile:5`
- `DL3015` — avoid additional packages by specifying `--no-install-recommends`:
  - `dockerfiles/dev_frontend_app/Dockerfile:5`
  - `dockerfiles/dev_navi_hey/Dockerfile:5`

_Found via Codacy/Hadolint (patterns `Hadolint_DL3008`, `Hadolint_DL3015`)._

## Problem
All four Dockerfiles install `rsync` via an unpinned `apt-get install -y rsync`. Unpinned apt packages make builds non-reproducible and can silently pull in newer (and potentially incompatible or vulnerable) package versions. `dockerfiles/dev_frontend/Dockerfile` already passes `--no-install-recommends`; the other three do not, so they may also pull in unnecessary recommended packages.

All four Dockerfiles share the same `base` stage, `FROM darthjee/node:0.2.1`, which is Debian 12 (bookworm). No Dockerfile in this repo currently pins an apt package version, so there is no existing in-repo convention to follow.

## Expected Behavior
Every `apt-get install` line across `dockerfiles/dev_app/Dockerfile`, `dockerfiles/dev_frontend_app/Dockerfile`, `dockerfiles/dev_frontend/Dockerfile`, and `dockerfiles/dev_navi_hey/Dockerfile` pins an explicit package version and passes `--no-install-recommends`, so Hadolint reports no `DL3008`/`DL3015` findings for these files and builds are reproducible.

## Solution
For each of the four Dockerfiles, change the `rsync` install line to pin the version resolved from the `darthjee/node:0.2.1` (Debian 12 / bookworm) base image and add `--no-install-recommends` where missing:

- `dockerfiles/dev_app/Dockerfile:5`, `dockerfiles/dev_frontend_app/Dockerfile:5`, `dockerfiles/dev_navi_hey/Dockerfile:5`:
  `apt-get install -y rsync` → `apt-get install -y --no-install-recommends rsync=3.2.7-1+deb12u6`
- `dockerfiles/dev_frontend/Dockerfile:6`: (already has `--no-install-recommends`)
  `apt-get install -y rsync --no-install-recommends` → `apt-get install -y --no-install-recommends rsync=3.2.7-1+deb12u6`

The pinned version (`3.2.7-1+deb12u6`) is the current `bookworm` main-repo candidate for `rsync` on this base image (verified via `apt-cache policy rsync` inside the image); the `bookworm-security` candidate is `3.2.7-1+deb12u5`. Whichever is picked should be verified against the version actually resolvable at build time, since Debian security updates can bump this over time — if the pinned version becomes unavailable in the future, the pin will need to be bumped, which is an accepted, expected maintenance cost of pinning.

A repo-wide check confirmed these are the only four Dockerfiles under `dockerfiles/` that invoke `apt-get` at all, so no other Dockerfile needs a similar fix.

## Benefits
- Reproducible dev image builds — the same `rsync` version is installed regardless of when the image is built.
- Avoids silently picking up incompatible or vulnerable newer package versions.
- Reduces install footprint by skipping unnecessary recommended packages.
- Resolves the Codacy/Hadolint `DL3008`/`DL3015` findings.
