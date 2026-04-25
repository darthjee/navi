# Issue: Serve Frontend from Navi

## Description

During development the frontend is served by the Vite dev server, but for a release the built frontend must be bundled with the Navi package and served directly by the Navi webserver.

## Problem

- The production Navi package does not include the built frontend assets.
- The Navi webserver has no route handlers to serve static frontend files.
- There is no documented build step to keep Navi's bundled frontend up to date when frontend code changes.

## Expected Behavior

- A `source/static/` folder holds the built frontend assets.
- Docker Compose mounts `source/static/` as the `dist/` output folder of the frontend Vite build, so a `yarn build` in the frontend automatically places assets where Navi can serve them.
- The Navi webserver serves:
  - `/` → `index.html`
  - `/assets/*` → static asset files, **with a path traversal security check** to prevent requests from escaping the assets folder
  - Any route with an anchor fragment (e.g. `/#/jobs`) → `index.html` (React Router handles client-side navigation)
- Documentation is updated to instruct developers to run a frontend build after making frontend changes, so Navi always has the latest version.

## Solution

- Create `source/static/` and configure Docker Compose to mount it as the frontend `dist/` directory.
- Add request handlers in the Navi webserver for:
  - `GET /` serving `index.html`
  - `GET /assets/*` serving static files with strict path validation (no traversal outside the assets folder)
  - Catch-all for hash-based routes serving `index.html`
- Update `docs/agents/` documentation and user-facing READMEs (`README.md`, `DOCKERHUB_DESCRIPTION.md`, `source/README.md`) with the build instructions.

## Security

- The `/assets/*` handler **must** validate that the resolved file path stays within `source/static/assets/`. Requests attempting path traversal (e.g. `../`) must be rejected with **403 Forbidden**.

## Benefits

- Navi can be released as a self-contained package that includes the frontend.
- No separate frontend server is needed in production.
- Developers have a clear, documented workflow for keeping the bundled frontend current.

---
See issue for details: https://github.com/darthjee/navi/issues/356
