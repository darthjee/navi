# Plan: Add Frontend Structure

## Overview

Add a Vite + React frontend application to Navi that displays worker and job data by consuming the existing `/stats.json` endpoint. The frontend runs in its own Docker container (with HMR in development) and builds to a shared static volume that the Express web server serves in production/static mode.

## Context

- The Express web server already exists (`source/lib/server/WebServer.js`, `Router.js`) and exposes `/stats.json`.
- `Router.js` currently only registers the `/stats.json` route via `RouteRegister`. It needs to also serve static files and provide an SPA fallback.
- `docker-compose.yml` already has a proxy service (`navi_proxy` using `darthjee/tent`) that routes to the sample dev backend. The same proxy can be extended to route frontend traffic.
- The pattern to follow is documented in `FRONTEND-EXPLAINED.md`: Vite and Express are fully decoupled; a shared Docker volume connects them.

## Implementation Steps

### Step 1 — Create the `frontend/` application

Create `frontend/` at the project root with a minimal Vite + React setup:

- `frontend/index.html` — entry HTML pointing to `src/main.jsx`
- `frontend/package.json` — scripts: `dev` (Vite dev server on port 8080), `build`; uses Yarn (not npm)
- `frontend/yarn.lock` — committed lockfile (required by the Dockerfile COPY step)
- `frontend/vite.config.js` — set `build.outDir` to `dist` (mapped to shared volume via Docker)
- `frontend/src/main.jsx` — React entry point
- `frontend/src/App.jsx` — component that fetches `/stats.json` and renders worker/job data

### Step 2 — Create the frontend Dockerfile

Create `dockerfiles/dev_frontend/Dockerfile` following the same multi-stage pattern as the other dev Dockerfiles in this project (see `sample-Dockerfile` at the project root):

```dockerfile
FROM darthjee/scripts:0.7.0 as scripts
FROM darthjee/vite_weave-base:0.0.4 as base

COPY --chown=node:node \
  ./frontend/package.json frontend/yarn.lock \
  /home/node/app/

######################################

FROM base as builder

ENV HOME_DIR /home/node

USER root
COPY --chown=node:node --from=scripts /home/scripts/builder/yarn_builder.sh /usr/local/sbin/yarn_builder.sh
RUN /bin/bash yarn_builder.sh

#######################
# FINAL IMAGE
FROM base
ENV HOME_DIR /home/node

COPY --chown=node:node --from=builder /home/node/yarn/new/ /usr/local/share/.cache/yarn/v6/

USER node
```

- Uses `darthjee/vite_weave-base:0.0.4` as the base image (provides Node + Vite tooling).
- Uses `darthjee/scripts` to install Yarn dependencies via `yarn_builder.sh` (same pattern as the navi dev Dockerfile).
- The default command to start the dev server (`yarn dev --host 0.0.0.0 --port 8080`) is set in `docker-compose.yml`, not in the Dockerfile.

### Step 3 — Add the shared Docker volume

Create the `docker_volumes/static/` directory (gitignored content, but the directory must exist).

Update `docker-compose.yml`:

1. Add a `frontend` service:
   - Builds from `dockerfiles/dev_frontend/Dockerfile`.
   - Mounts `./frontend:/app` and the shared volume `./docker_volumes/static:/app/dist`.
   - Exposes the Vite dev server port (e.g. `3030:8080`).

2. In the `base` anchor (used by `navi_app`), mount the shared volume as the Express static folder:
   ```yaml
   - ./docker_volumes/static:/home/node/app/public
   ```

### Step 4 — Update the Express Router to serve static files

In `source/lib/server/Router.js`, after registering the API routes and before returning the router, add:

```js
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../../public');

// Serve Vite build output
router.use(express.static(publicDir));

// SPA fallback
router.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});
```

This must be added **after** `/stats.json` so the API route takes precedence.

### Step 5 — Update the proxy configuration (development)

Update the proxy configuration in `docker_volumes/proxy_configuration/` (Tent config) to add routing rules:

- `/stats.json` → navi web server container
- `/*` → `frontend` container (Vite dev server)

This enables development with HMR through a single browser entry point.

### Step 6 — Implement the React stats page

In `frontend/src/App.jsx`, implement:

- `useEffect` to `fetch('/stats.json')` on mount.
- Display worker states (idle, busy, failed) and job queue summary.
- Basic styling (inline or a minimal CSS file).

## Files to Change

- `source/lib/server/Router.js` — add static file serving and SPA fallback
- `docker-compose.yml` — add `frontend` service and shared static volume mount in `base`
- `docker_volumes/proxy_configuration/` — update Tent routing rules

## Files to Create

- `frontend/index.html`
- `frontend/package.json`
- `frontend/yarn.lock`
- `frontend/vite.config.js`
- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `dockerfiles/dev_frontend/Dockerfile`
- `docker_volumes/static/` (empty directory, gitignored)

## Notes

- In production mode (built image), the frontend is not present — the web server is optional and only activated via `web:` config. Static files must be bundled into the image or built before deployment; this plan covers the development and static-mode workflow only.
- The SPA fallback (`GET *`) must come last in the router so it does not shadow the `/stats.json` API route.
- `docker_volumes/static/` should be added to `.gitignore` (contents only); the directory itself may need a `.gitkeep` so it exists when the volume mounts.
