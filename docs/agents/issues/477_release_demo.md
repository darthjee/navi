# Issue: Release Demo

## Description

Create a demo application by releasing a `navi-hey` demo Docker image and a demo dev app deployment,
with CI pipeline steps to build and release both after each version bump.

## Problem

- There is no public demo application for Navi.
- No Dockerfile exists for a demo image based on `darthjee/navi-hey`.
- The version bump script (`scripts/bump_version.sh`) does not update a demo Dockerfile.
- The CI pipeline has no step to build and release a demo image or deploy a demo dev app.
- There is no `navi-config.yml` tailored for the demo (shutdown button disabled, base URL as a variable).

## Expected Behavior

- A new Dockerfile for the demo Navi image exists, based on `darthjee/navi-hey:<current version>`.
- When `scripts/bump_version.sh` runs, the demo Dockerfile is also updated to use the newest `darthjee/navi-hey` version.
- A `navi-config.yml` file lives alongside the demo Dockerfile, copied from `docker_volumes/config/` sample, with:
  - Shutdown button disabled.
  - Client base URL configured via an environment variable.
- CI has a `build-and-release-demo` job (runs after `darthjee/navi` image is released) that deploys the demo via `scripts/deploy.sh`:
  ```yaml
  build-and-release-demo:
    machine: true
    steps:
      - checkout
      - run:
          name: Trigger Deploy
          command: RENDER_SERVICE_NAME=$DEMO_RENDER_SERVICE_NAME scripts/deploy.sh deploy
  ```
- CI has a `build-and-release-demo-app` job to deploy the dev app as a demo dev app.
- A Dockerfile for the demo dev app exists, based on `darthjee/node`, copying `dev/app/` contents and running `yarn install --production`.

## Solution

- Create a demo Dockerfile in a dedicated folder (e.g., `docker/demo/`) based on `darthjee/navi-hey:<version>`.
- Create `navi-config.yml` in the same folder, derived from the sample config, with shutdown disabled and base URL as a variable.
- Update `scripts/bump_version.sh` to patch the demo Dockerfile version reference.
- Add `build-and-release-demo` CI job that triggers after the main image release.
- Create a Dockerfile for the demo dev app (based on `darthjee/node`, production dependencies only).
- Add `build-and-release-demo-app` CI job to deploy the demo dev app.

## Benefits

- Provides a live, publicly accessible demo of Navi for new users and stakeholders.
- Keeps the demo image automatically in sync with every new release.
- Separates demo infrastructure from production with minimal overhead.

---
See issue for details: https://github.com/darthjee/navi/issues/477
