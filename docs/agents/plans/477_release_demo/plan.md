# Plan: Release Demo

## Overview

Create a publicly accessible demo of Navi by adding two demo Dockerfiles, a demo config file,
updating the version bump script and `render.sh`, and wiring two new CI jobs to deploy both
demo services automatically after each release.

## Context

- Navi is published as `darthjee/navi-hey` on Docker Hub via the existing `build-and-release` CI job.
- Deployments to Render.com are triggered via `scripts/deploy.sh`, which sources `scripts/render.sh`.
  `render.sh` currently hardcodes `RENDER_SERVICE_NAME="oak"`, which must be made overridable.
- `scripts/deploy.sh` already supports being called with `RENDER_SERVICE_NAME=<name>` as an
  env-var prefix — but only if `render.sh` respects the caller-supplied value.
- `scripts/bump_version.sh` currently updates `README.md` and `source/package.json`; it must
  also patch the version pin in the demo navi Dockerfile.
- Dockerfiles follow the naming convention `dockerfiles/<purpose>/Dockerfile`.

## Implementation Steps

### Step 1 — Make `render.sh` respect a caller-supplied service name

Change the hardcoded assignment:
```bash
RENDER_SERVICE_NAME="oak"
```
to a default-only assignment:
```bash
RENDER_SERVICE_NAME="${RENDER_SERVICE_NAME:-oak}"
```

This lets CI pass `RENDER_SERVICE_NAME=$DEMO_RENDER_SERVICE_NAME` before calling `deploy.sh`
without the value being clobbered.

### Step 2 — Create the demo navi Dockerfile

Add `dockerfiles/demo_navi_hey/Dockerfile` based on the already-released `darthjee/navi-hey` image:

```dockerfile
FROM darthjee/navi-hey:<version>

COPY navi-config.yml /home/node/app/config/navi-config.yml
```

The `<version>` tag must match the version in `source/package.json` at the time the file is
created, and is kept in sync by `bump_version.sh` on every release (see Step 4).
The CI flow guarantees the image exists at that version before the demo deploy runs:
`npm-publish` → `build-and-release` (publishes `darthjee/navi-hey:<version>`) → `build-and-release-demo`.

### Step 3 — Create the demo navi config file

Add `dockerfiles/demo_navi_hey/navi-config.yml`, derived from `docker_volumes/config/navi_config.yml.sample`:

```yaml
web:
  port: 3000
  enable_shutdown: false
workers:
  quantity: 5
clients:
  default:
    base_url: $BASE_URL
    timeout: 5000
resources:
  # ... (same resource list as the sample)
```

Key differences from the sample:
- `web.enable_shutdown: false` — disables the shutdown button in the UI.
- `clients.default.base_url: $BASE_URL` — resolved at runtime from the `BASE_URL` environment
  variable (Navi supports `$VAR` / `${VAR}` syntax via `EnvResolver`).

### Step 4 — Update `bump_version.sh` to patch the demo Dockerfile

Add a `sed` call after the existing substitutions so the demo Dockerfile's `FROM` line is
updated to the new version at the same time as `source/package.json`. This is critical because
the subsequent CI `build-and-release` step will publish exactly that version of `darthjee/navi-hey`,
and `build-and-release-demo` must reference the same version.

```bash
DEMO_DOCKERFILE="$ROOT_DIR/dockerfiles/demo_navi_hey/Dockerfile"

sed -i '' \
  "s|FROM darthjee/navi-hey:.*|FROM darthjee/navi-hey:$VERSION|" \
  "$DEMO_DOCKERFILE"
```

### Step 5 — Create the demo dev app Dockerfile

Add `dockerfiles/demo_dev_app/Dockerfile` based on `darthjee/node`, copying `dev/app/` and
installing only production dependencies. Mirrors the dev app image but skips dev dependencies
and starts the server directly:

```dockerfile
FROM darthjee/node:0.2.1

COPY --chown=node:node dev/app/ /home/node/app/

RUN cd /home/node/app && yarn install --production

CMD ["node", "server.js"]
```

### Step 6 — Add CI jobs

In `.circleci/config.yml`:

**Workflow** — add two jobs after `build-and-release`:

```yaml
- build-and-release-demo:
    requires: [build-and-release]
    filters:
      tags:
        only: /\d+\.\d+\.\d+/
      branches:
        ignore: /.*/
- build-and-release-demo-app:
    requires: [build-and-release]
    filters:
      tags:
        only: /\d+\.\d+\.\d+/
      branches:
        ignore: /.*/
```

**Job definitions**:

```yaml
build-and-release-demo:
  machine: true
  steps:
    - checkout
    - run:
        name: Trigger Deploy
        command: RENDER_SERVICE_NAME=$DEMO_RENDER_SERVICE_NAME scripts/deploy.sh deploy

build-and-release-demo-app:
  machine: true
  steps:
    - checkout
    - run:
        name: Trigger Deploy
        command: RENDER_SERVICE_NAME=$DEMO_APP_RENDER_SERVICE_NAME scripts/deploy.sh deploy
```

`DEMO_RENDER_SERVICE_NAME` and `DEMO_APP_RENDER_SERVICE_NAME` must be set as environment
variables in the CircleCI project settings (Render.com service names for the two demo services).

## Files to Change

- `scripts/render.sh` — make `RENDER_SERVICE_NAME` overridable via env var (default `oak`)
- `scripts/bump_version.sh` — add `sed` to patch `dockerfiles/demo_navi_hey/Dockerfile` version
- `dockerfiles/demo_navi_hey/Dockerfile` — new: demo navi image based on `darthjee/navi-hey`
- `dockerfiles/demo_navi_hey/navi-config.yml` — new: demo config (shutdown off, base URL from env)
- `dockerfiles/demo_dev_app/Dockerfile` — new: demo dev app image based on `darthjee/node`
- `.circleci/config.yml` — add `build-and-release-demo` and `build-and-release-demo-app` jobs

## Notes

- The CircleCI env vars `DEMO_RENDER_SERVICE_NAME` and `DEMO_APP_RENDER_SERVICE_NAME` must be
  configured manually in the CircleCI project settings — they are not committed to the repo.
- The demo navi Dockerfile version pin must be initialised to the current version in
  `source/package.json` when the file is first created; from then on `bump_version.sh` keeps
  it in sync automatically on every release.
- No tests are expected for the Dockerfiles or CI config; no source code changes are needed.
