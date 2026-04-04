# Issue: Add Proxy for Frontend Development

## Description

Navi's frontend is developed as a separate Vite application (`frontend/`). During frontend development, the Vite dev server must be reachable through a proxy so that HMR (hot module replacement) works correctly. When not developing the frontend, Navi itself is capable of serving the compiled static files.

A new Tent-powered proxy container is needed to route web traffic to the correct target based on a `FRONTEND_DEV_MODE` environment flag. This proxy is distinct from the existing `navi_proxy` (which sits in front of the dev-app and uses caching). The web proxy performs **routing only — no caching**.

---

## Problem

- There is no proxy in the Docker Compose setup that routes browser/web traffic to either the Vite dev server or Navi.
- Without this proxy, frontend development cannot be done through a stable, unified entry point.
- HMR requires that Vite-specific paths (`/@vite/`, `/@react-refresh`, etc.) are forwarded transparently to the Vite container.

---

## Expected Behavior

A new Docker service (`navi_web_proxy`) using `darthjee/tent` is added. Its behavior is controlled by the `FRONTEND_DEV_MODE` environment variable:

### `FRONTEND_DEV_MODE=true` (frontend development)

All requests are forwarded to the Vite dev server (`navi_frontend`). No caching. The following paths must be proxied to support HMR:

- `/` (exact)
- `/assets/js/` (begins with)
- `/assets/css/` (begins with)
- `/@vite/` (begins with)
- `/node_modules/` (begins with)
- `/@react-refresh` (exact)

### `FRONTEND_DEV_MODE=false` (or absent)

All requests are forwarded to the Navi application (`navi_app`), which serves the compiled frontend static files. No caching.

---

## Solution

1. **New configuration folder** `dev/web_proxy/` with:
   - `configure.php` — entry point, includes rule files.
   - `rules/frontend.php` — routing rules controlled by `FRONTEND_DEV_MODE`.

2. **New Docker Compose service** `navi_web_proxy`:
   - Image: `darthjee/tent` (same version as `navi_proxy`).
   - Links: `navi_frontend:frontend` and `navi_app:backend` (or equivalent aliases).
   - Volumes: `./dev/web_proxy:/var/www/html/configuration/`.
   - Exposes a host port (e.g. `3030:80`).
   - Receives `FRONTEND_DEV_MODE` from the shared `.env` file.

3. **No cache volume** is needed — this proxy does not cache responses.

4. **Rule file logic** mirrors the pattern from the existing Tent how-to (`docs/HOW_TO_USE_DARTHJEE-TENT.md`, Frontend Dev Mode Flip section), adapted so that the `false` branch proxies to Navi instead of serving static files directly from Tent.

---

## Benefits

- Enables frontend development with full HMR support through a single, stable entry point.
- Keeps the Navi app as the authoritative server for compiled frontend assets (no duplication of static file serving).
- Consistent with the existing proxy pattern used by the dev-app setup.
- Switching between dev and non-dev mode requires only a change to `.env` and a container restart — no code changes or image rebuilds.

---

See issue for details: https://github.com/darthjee/navi/issues/137
