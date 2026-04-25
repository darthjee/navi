# Part 2 — Webserver Route Handlers

## Goal

Add Express route handlers to the Navi webserver to serve the built frontend from `source/static/`.

## Steps

### Handler 1 — `GET /`

Serve `source/static/index.html`. This is the React app entry point.

### Handler 2 — `GET /assets/*`

Serve static files from `source/static/assets/`. Before serving, resolve the full file path and verify it stays within `source/static/assets/`. If the resolved path escapes that directory (path traversal attempt), respond with **403 Forbidden**.

### Handler 3 — Hash-based route fallback

Any request that reaches the router without matching a more specific route (i.e. `/#/jobs`, `/#/job/:id`, etc.) should serve `index.html` so React Router can handle client-side navigation. Since the `#` fragment is never sent to the server, this is effectively a catch-all for unmatched GET requests.

### Router wiring

Register all three handlers in `source/lib/server/Router.js` via `RouteRegister`.

## Files to Change

- `source/lib/server/IndexRequestHandler.js` — serves `index.html` for `/` and catch-all
- `source/lib/server/AssetsRequestHandler.js` — serves `/assets/*` with path traversal guard (403 on violation)
- `source/lib/server/Router.js` — register the new handlers

## Security Note

The path traversal check in `AssetsRequestHandler` must use `path.resolve()` and verify the result starts with the absolute path of `source/static/assets/`. Never trust the raw request path.

## Open Questions

- Does `source/lib/server/Router.js` already have a catch-all for SPA navigation? If so, it may just need to be updated to point to `source/static/index.html` instead of `source/public/index.html`.
