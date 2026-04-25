# Plan: Use # for Dev App Frontend Routes

## Overview

Switch the dev frontend React app from `BrowserRouter` to `HashRouter` so all client-side routes
use the `/#/...` format. This makes the app a proper SPA: the server only ever needs to serve
`index.html` for the root path, and the browser handles all navigation via the hash fragment.

## Context

The dev frontend (`dev/frontend/`) currently uses `BrowserRouter`, which produces plain path-based
URLs (`/categories`, `/categories/:id`, etc.). The proxy must know about every frontend route to
redirect them to `index.html`. With `HashRouter`, the hash fragment (`#/...`) is never sent to the
server, so the proxy only needs to serve `index.html` at `/` — all routing happens on the client.

## Implementation Steps

### Step 1 — Switch router in `App.jsx`

Replace `BrowserRouter` with `HashRouter` in `dev/frontend/src/App.jsx`.

```jsx
import { HashRouter } from 'react-router-dom';
// Replace <BrowserRouter> with <HashRouter>
```

No changes are needed to `<Route>` definitions, `<Link>` components, or `useParams` calls —
React Router handles the hash prefix internally. All `to` props remain as `/categories`,
`/categories/${id}`, etc.

### Step 2 — Rebuild the static assets

Run the Vite build to regenerate the compiled JS/CSS bundle:

```bash
cd dev/frontend && yarn build
```

Copy the updated build output to `dev/proxy/static/` so the proxy serves the new bundle.

### Step 3 — Verify the proxy configuration

The current proxy (`dev/proxy/rules/frontend.php`) already handles both cases correctly:
- Exact match on `/` → serves `index.html` (handles all hash-based navigation)
- `begins_with` `/` → serves static assets (`/assets/index-*.js`, `/assets/index-*.css`)

No proxy changes are needed.

### Step 4 — Run CI checks locally

Verify linting and tests pass before opening a PR.

## Files to Change

- `dev/frontend/src/App.jsx` — replace `BrowserRouter` import and usage with `HashRouter`
- `dev/proxy/static/assets/index-*.js` — rebuilt JS bundle (hash-router-aware)
- `dev/proxy/static/assets/index-*.css` — rebuilt CSS bundle (if changed)
- `dev/proxy/static/index.html` — rebuilt HTML entry point (if changed)

## Notes

- Tests in `dev/frontend/spec/` use `MemoryRouter`, not `BrowserRouter` or `HashRouter`, so they
  are unaffected by this change. Href values in specs (e.g. `/categories`) remain valid because
  `MemoryRouter` renders links with plain paths regardless of the app router type.
- The hash fragment (`#/...`) is never sent to the server, so deep links and page refreshes will
  work correctly without any additional server-side routing config.
- The old static asset files (JS/CSS with old content hashes) should be removed when the new
  build replaces them.

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/frontend`: `cd dev/frontend; npm run coverage` (CircleCI job: `jasmine-dev-frontend`)
- `dev/frontend`: `cd dev/frontend; npm run lint` (CircleCI job: `checks-dev-frontend`)
