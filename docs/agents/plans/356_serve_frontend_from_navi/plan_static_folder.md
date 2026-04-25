# Part 1 — Static Folder and Docker Compose Wiring

## Goal

Create `source/static/` as the location where the built frontend assets will live, and configure Docker Compose to mount it as the Vite `dist/` output folder so that `yarn build` inside the frontend container writes directly into it.

## Steps

- Create `source/static/` (with a `.gitkeep` so it is tracked but empty).
- Confirm that Vite is configured to build into `frontend/dist/`. If not, update `frontend/vite.config.js` to set `outDir` to `dist`.
- Update `docker-compose.yml` to mount `source/static/` as `frontend/dist/` inside the frontend service container, so `yarn build` writes directly into `source/static/`.

## Files to Change

- `source/static/.gitkeep` — new empty placeholder
- `docker-compose.yml` — add volume mount for `source/static/` → `frontend/dist/`
- `frontend/vite.config.js` — set `outDir: 'dist'` if not already configured
