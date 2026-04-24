# Plan: Documentation Updates

## Files to update

### `docs/agents/dev-app.md`

Add a section describing the new frontend:

- Purpose: a React + Vite SPA that consumes the dev app's JSON endpoints via the dev proxy.
- Location: `dev/frontend/`.
- How to build: `yarn build` (inside the `navi_dev_frontend` container or directly in `dev/frontend/`).
- How to run tests: `yarn test` inside `dev/frontend/` or via Docker Compose.
- How to run lint: `yarn lint` inside `dev/frontend/`.
- Pages and their routes (table).
- Data flow: browser → `dev/proxy` → `.json` → `dev/app` or static → `dev/proxy/static/`.

### `docs/agents/dev-proxy.md`

Update to reflect the new proxy rules:

- Document that `.json` requests are forwarded to `dev/app` (existing rule, now restricted to `.json` only).
- Document the new static file serving rule (`dev/proxy/static/` → Vite build output).
- Document the SPA fallback rule (`index.html` for all non-matched paths).
- Explain the rule evaluation order and why it matters.

### `docs/agents/architecture.md` (or `overview.md`)

Add `dev/frontend/` to the folder layout section:

```
dev/
  app/          ← Express JSON API (sample backend)
  frontend/     ← React + Vite SPA (dev frontend, consumes dev/app via dev/proxy)
  proxy/        ← Tent reverse proxy (routes .json → app, static → frontend build)
```

### `docs/agents/flow.md` (if applicable)

Add a paragraph or diagram showing the full local dev request flow:

```
Browser
  └─► dev/proxy (:3010)
        ├─► *.json  ──► dev/app (:3020)
        └─► other   ──► dev/proxy/static/ (Vite build output)
                          └─► index.html (SPA fallback for unmatched paths)
```
