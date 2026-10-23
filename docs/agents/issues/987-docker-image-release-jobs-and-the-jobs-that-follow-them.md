# Issue: Docker image release jobs and the jobs that follow them

## Description
Part of Epic #977 (release-cycle overhaul). Add always-run release jobs for the two Docker images, `darthjee/navi-hey` and `darthjee/navi-hey-client`. Then make the jobs after each image act only when that image was released.

## Ownership
architect owns `scripts/` and `.circleci/config.yml`. `docker` handles any Dockerfile or `Makefile` change.

## Dependencies
Sub-issue 5 of #977. It builds on #986, the per-package npm release jobs (`release-navi-hey` and `release-navi-hey-client`).

## Problem
On every `X.Y.Z` tag, `build-and-release` builds and pushes `darthjee/navi-hey`. `darthjee/navi-hey-client` is only built by the old `client-` pipeline, whose job definitions are no longer in any workflow. In the new cycle, each image releases only when its version is new on Docker Hub. The jobs after it (description, demos, test harness) should only act on a fresh release.

## Expected Behavior
- On an `X.Y.Z` tag, two image jobs always run:
  - `release-darthjee-navi-hey`, after `release-navi-hey`;
  - `release-darthjee-navi-hey-client`, after `release-navi-hey-client`.
- Each image job:
  1. reads the version from its folder's `package.json` (`source/` or `clients/node/`);
  2. checks Docker Hub for `<image>:<version>`;
  3. if the tag is missing, builds and pushes `<image>:<version>` and `:latest`, otherwise does nothing;
  4. records whether it released (`true`/`false`) in a CircleCI workspace file, `released/<image>`.
- The client image is tagged from `clients/node/package.json`, not from a `client-` tag.
- These jobs act only when `darthjee/navi-hey` released:
  - `update-description`
  - `build-and-release-demo`
  - `build-and-release-demo-app`
  - `build-and-release-navi-hey-test`
- `update-description-client` acts only when `darthjee/navi-hey-client` released.
- The jobs after an image always run. Each one attaches the workspace and exits 0 early, as a no-op, when its image did not release.

## Solution
- **Docker Hub check:** add a script under `scripts/ci/`, run through `scripts/ci.sh`. It calls the Docker Hub API with `curl https://hub.docker.com/v2/repositories/<image>/tags/<version>`, treats 200 as "exists" and 404 as "release", and fails on anything else. The images are public, so it needs no login.
- **Image jobs:** each one does the check, then `make release` or `make release-client` with `TAG=<package.json version>`, then writes the workspace file.
- **Released signal:** the image jobs write `released/<image>` with `persist_to_workspace`. The jobs after them use `attach_workspace` plus a small shared guard that exits early when the value is `false`.
- **Cleanup:** replace the old `build-and-release` job. Drop the unused `build-and-release-client` job definition. Add `update-description-client` to the workflow.
- **Docs:** update the agent docs that describe the image release. The user-facing docs are left to #989.
- See `docs/agents/specs/release/ci-flow.md` and `docs/agents/specs/release/detection.md`.
