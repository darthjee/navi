# Issue: Add Frontend Structure

## Description

Add a Vite + React frontend to the Navi web application so that users can visualize worker and job data through a browser interface. The web server already exposes a `/stats.json` endpoint (added in issue #128); this issue is about building the frontend that consumes and displays that data.

## Problem

- The existing web server (`WebServer`, `StatsRequestHandler`) only serves raw JSON data at `/stats.json`.
- There is no visual interface for operators to inspect worker status and job queue information.

## Expected Behavior

- A `frontend/` directory exists at the project root containing a Vite + React application.
- In development, a dedicated container runs the Vite dev server (with HMR) alongside the Express container.
- In production / static mode, the Vite app is compiled and its output is served by the existing Express web server from a `public/` folder.
- A shared Docker volume connects the Vite build output to the Express static folder, with no copy step required.

## Solution

Follow the Vite + React pattern documented in `FRONTEND-EXPLAINED.md`:

1. Create `frontend/` with `index.html`, `vite.config.js`, and `package.json` (scripts: `dev`, `build`).
2. Configure `vite.config.js` so `outDir` points to the shared Docker volume path (maps to `source/public/` inside the Express container).
3. Add a `frontend` service to `docker-compose.yml` that mounts `./frontend` as `/app` and the shared static volume as `/app/dist`.
4. Mount the same shared static volume in the `app` service as `source/public/` so Express serves it automatically.
5. Update the `WebServer` (or its router) to:
   - Serve static files from `public/`.
   - Add an SPA fallback (`GET *`) that returns `index.html` for unmatched routes.
6. Implement a minimal React page that fetches `/stats.json` and displays worker/job data.

## Benefits

- Operators get a real-time visual overview of the cache-warmer state without needing to parse raw JSON.
- The Vite + Express decoupling means the frontend can be developed independently and the production image stays lightweight (only static files, no Vite at runtime).

---
See issue for details: https://github.com/darthjee/navi/issues/132
