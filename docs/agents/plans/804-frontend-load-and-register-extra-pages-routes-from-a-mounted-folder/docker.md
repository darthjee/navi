# Docker Plan: Frontend: load and register extra pages/routes from a mounted folder

Main plan: [plan.md](plan.md)

## Shared contracts

This agent **relies on** (shared contract #6, already fixed by IMPL-3 / #803):

- `NAVI_EXTENSIONS_ENABLED` — truthy `1|true|yes|on`, default off.
- `NAVI_EXTENSIONS_DIR` — default `/navi/extensions`.
- One mounted volume with reserved `backend/` and `frontend/` subtrees.
- `docker-compose.yml` already has a commented `navi_app` block mounting
  `./docker_volumes/extensions:/navi/extensions` for the backend track.

## Implementation Steps

### Step 1 — Extend the `docker-compose.yml` extension example to cover `frontend/`

The existing commented block under `navi_app` only mentions "mounted
route-handler extensions" (backend). Update it so the same mount also documents
the frontend bundle case:

- Reword the comment to "mounted route-handler **and frontend** extensions".
- Note the folder layout the single mount now serves:
  `./docker_volumes/extensions/backend/*.js` (Express handlers) and
  `./docker_volumes/extensions/frontend/*.js` (+ optional sibling `*.css`,
  pre-built ESM bundles) — one volume, two subtrees.
- Keep the existing note that a per-service `volumes:` key overrides rather than
  extends the merged `*base` mounts (so the block must repeat the base mounts).
- No change to any Dockerfile — IMPL-3 already added the
  `NAVI_EXTENSIONS_ENABLED` / `NAVI_EXTENSIONS_DIR` defaults to
  `dockerfiles/production_navi_hey/Dockerfile`, and the frontend track adds no
  build step to any image (runtime registration, stock image unchanged).

Validate locally with `docker compose config`.

## Files to Change

- `docker-compose.yml` — extend the commented extensions block under `navi_app`
  to document the `frontend/` subtree alongside `backend/`.

## Notes

- If IMPL-3 also added an `extensions` example somewhere in `dev/` compose
  wiring, mirror the wording there; otherwise `docker-compose.yml` is the only
  file.
- Dev-server (`navi_frontend`, Vite) extension support is explicitly out of scope
  for this issue — do not add a proxy or volume to that service.
