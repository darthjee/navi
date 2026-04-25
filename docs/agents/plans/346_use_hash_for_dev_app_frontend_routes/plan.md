# Plan: Use # for Dev App Frontend Routes

## Overview

Switch the dev frontend React app from `BrowserRouter` to `HashRouter` so all client-side routes
use the `/#/...` format. Update the proxy rules to reflect the simplified routing model, and update
the agent documentation in `docs/agents/` to match the new state.

## Context

The dev frontend (`dev/frontend/`) currently uses `BrowserRouter`, which produces plain path-based
URLs (`/categories`, `/categories/:id`, etc.). With `HashRouter`, the hash fragment (`#/...`) is
never sent to the server, so the proxy only ever needs to handle:
- `GET /` (exactly) — serve `index.html`
- `GET /assets/*` — serve compiled JS/CSS bundles

All client-side navigation happens via the hash and requires no server-side route config.

## Implementation Steps

### Step 1 — Switch router in `App.jsx`

In `dev/frontend/src/App.jsx`, replace `BrowserRouter` with `HashRouter`:

```jsx
import { HashRouter } from 'react-router-dom';
// Replace <BrowserRouter> with <HashRouter>
```

No changes are needed to `<Route>` definitions, `<Link>` components, or `useParams` calls —
React Router handles the hash prefix internally. All `to` props remain as `/categories`,
`/categories/${id}`, etc.

### Step 2 — Update the proxy rules

Edit `dev/proxy/rules/frontend.php` to reflect the hash routing model explicitly:

- Keep the exact-match rule for `/` → `index.html` (serves the SPA entry point for all hash navigation)
- Keep the `begins_with /` rule for static assets (serves `/assets/index-*.js`, `/assets/index-*.css`)
- Remove or update any rules or comments that were written to handle path-based frontend routes
  (e.g., `/categories`, `/categories/:id`, etc.) since those paths are no longer sent to the server

### Step 3 — Rebuild the static assets

Run the Vite build to regenerate the compiled JS/CSS bundle with the new `HashRouter`:

```bash
cd dev/frontend && yarn build
```

Copy / overwrite the output in `dev/proxy/static/` (the old content-hashed files should be
replaced with the new ones).

### Step 4 — Update `docs/agents/dev-app.md`

Update the `## Routes` table under `dev/frontend/` to reflect hash-based paths:

| Path | Component |
|------|-----------|
| `/#/` | `IndexPage` |
| `/#/categories` | `CategoriesIndexPage` |
| `/#/categories/:id` | `CategoryPage` |
| `/#/categories/:id/items` | `CategoryItemsIndexPage` |
| `/#/categories/:categoryId/items/:id` | `CategoryItemPage` |

Also update the `App.jsx` description from `BrowserRouter + Routes` to `HashRouter + Routes`.

### Step 5 — Update `docs/agents/dev-proxy.md`

Update the `### dev/proxy/rules/frontend.php` section to:
- Show the current (correct) handler type (`static` with `location`, not `static_file`/`fixed_file`)
- Reflect that with hash routing, the proxy no longer needs to handle individual frontend routes —
  only `/` and static assets

Also update the **Request flow** section to note that hash fragments are never sent to the server.

### Step 6 — Run CI checks locally

```bash
cd dev/frontend && npm run coverage   # jasmine-dev-frontend
cd dev/frontend && npm run lint       # checks-dev-frontend
```

## Files to Change

- `dev/frontend/src/App.jsx` — replace `BrowserRouter` with `HashRouter`
- `dev/proxy/rules/frontend.php` — clean up rules to match the hash routing model
- `dev/proxy/static/assets/index-*.js` — rebuilt JS bundle
- `dev/proxy/static/assets/index-*.css` — rebuilt CSS bundle (if changed)
- `dev/proxy/static/index.html` — rebuilt HTML entry point (if changed)
- `docs/agents/dev-app.md` — update routes table and `App.jsx` description
- `docs/agents/dev-proxy.md` — update `frontend.php` code block and request flow section

## Notes

- Tests in `dev/frontend/spec/` use `MemoryRouter` and are unaffected by this change.
  Href values in specs (e.g., `/categories`) remain valid because `MemoryRouter` renders
  links with plain paths regardless of the app router type.
- The hash fragment (`#/...`) is never sent to the server, so deep links and page refreshes work
  without any additional server-side routing.
- Old static asset files (with old content hashes) should be removed when the new build replaces them.

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/frontend`: `cd dev/frontend; npm run coverage` (CircleCI job: `jasmine-dev-frontend`)
- `dev/frontend`: `cd dev/frontend; npm run lint` (CircleCI job: `checks-dev-frontend`)
