# Part 1 — Static Folder and Docker Compose Wiring

## Goal

Create `source/static/` as the location where the built frontend assets will live, and configure Docker Compose to mount it as the Vite `dist/` output folder so that `yarn build` inside the frontend container writes directly into it.

## Steps

- Create `source/static/` (with a `.gitkeep` so it is tracked but empty).
- Update `docker-compose.yml` to mount `source/static/` as the `dist/` directory of the frontend service, replacing or supplementing the current build output path.
- Verify that running `yarn build` in the frontend container writes assets into `source/static/`.

## Files to Change

- `source/static/.gitkeep` — new empty placeholder
- `docker-compose.yml` — add volume mount for `source/static/` → frontend `dist/`

## Open Questions

- What is the current Vite `outDir` configured in `frontend/vite.config.js`? It may need to be updated or the mount may be sufficient.
