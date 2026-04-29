# Plan: Add List of Base URLs

## Overview

Add a `GET /clients/base_urls.json` endpoint that returns all unique client base URLs, and
display them in the frontend header — as a single link when there is one, or as a floating
dropdown menu (with scroll above 10 items) when there are many.

## Context

Clients are loaded from the YAML config and held in a `ClientRegistry`. Each client has a
`baseUrl`. The web server already follows the pattern of `RequestHandler` subclasses wired
by `Router`. The frontend header already exists and is the right place for this addition
since it is visible across all views.

## Implementation Steps

### Step 1 — Add `BaseUrlsRequestHandler`

Create `source/lib/server/BaseUrlsRequestHandler.js` extending `RequestHandler`.

- `handle(req, res)` reads the `ClientRegistry`, collects all unique `baseUrl` values, and
  responds with JSON: `{ base_urls: [...] }`.
- The handler needs access to `ClientRegistry` — pass it via the constructor, following the
  same pattern as other handlers that receive registry references.

Add spec `source/spec/lib/server/BaseUrlsRequestHandler_spec.js`.

### Step 2 — Register the new route in `Router`

In `source/lib/server/Router.js`, register:

```
GET /clients/base_urls.json → BaseUrlsRequestHandler
```

Pass the `ClientRegistry` instance when constructing the handler.

`Router` currently receives its dependencies at build time — confirm how `ClientRegistry`
is made available there and thread it through if needed (likely via `WebServer` →
`Application`).

Update `Router_spec.js` to cover the new route.

### Step 3 — Thread `ClientRegistry` to `WebServer` / `Router`

If `ClientRegistry` is not already available in `WebServer`, update the build chain:

- `Application` builds `WebServer` with `clientRegistry` included.
- `WebServer` passes it to `Router`.
- `Router` passes it to `BaseUrlsRequestHandler`.

Update specs along the chain as needed.

### Step 4 — Add a serializer for base URLs (if applicable)

If the project uses serializer classes for JSON responses (check existing handlers), add a
`BaseUrlsSerializer` that formats the response object. Otherwise, inline the JSON shape
directly in the handler.

### Step 5 — Add frontend API client method

In the frontend, add a method to the existing API client (wherever `/stats.json` and
`/jobs/:status.json` are fetched) to call `GET /clients/base_urls.json` and return the
array of URLs.

### Step 6 — Add `BaseUrlsMenu` component to the header

Create a new React component (e.g. `BaseUrlsMenu`) in `frontend/src/` that:

- Fetches `/clients/base_urls.json` on mount.
- **Single URL:** renders a single `<a>` link/button pointing to that URL.
- **Multiple URLs:** renders a toggle button that opens a floating menu listing all URLs as
  links/buttons.
  - The floating menu has `overflow-y: auto` and a `max-height` that caps at ~10 items;
    beyond that, it scrolls.

Integrate `BaseUrlsMenu` into the header component (updated in issue #408).

## Files to Change

### Backend
- `source/lib/server/BaseUrlsRequestHandler.js` — new handler
- `source/lib/server/Router.js` — register new route
- `source/lib/server/WebServer.js` — thread `clientRegistry` if needed
- `source/lib/services/Application.js` — pass `clientRegistry` to `WebServer` if needed
- `source/spec/lib/server/BaseUrlsRequestHandler_spec.js` — new spec
- `source/spec/lib/server/Router_spec.js` — update
- `source/spec/lib/server/WebServer_spec.js` — update if needed
- `source/spec/lib/services/Application_spec.js` — update if needed

### Frontend
- `frontend/src/` — new `BaseUrlsMenu` component
- `frontend/src/` — API client update
- `frontend/src/` — header component update (integrate `BaseUrlsMenu`)

### Documentation
- `docs/agents/web-server.md` — document the new `GET /clients/base_urls.json` route and
  `BaseUrlsRequestHandler`
- `docs/agents/frontend.md` — document the new `BaseUrlsMenu` component and its behaviour
- `docs/agents/architecture.md` — add `BaseUrlsRequestHandler` to the server module table

## Notes

- Uniqueness of base URLs: use a `Set` or `[...new Set(...)]` to deduplicate before
  responding.
- The floating menu positioning (absolute/fixed) should be confirmed against the existing
  header layout from issue #408 to avoid z-index or overflow conflicts.
- If `ClientRegistry` is already accessible from the web server context, Steps 3 may be
  minimal or a no-op — confirm by reading the code before implementing.

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `docker-compose run --rm navi_app yarn test` (CircleCI job: `source_tests`)
- `source/`: `docker-compose run --rm navi_app yarn lint` (CircleCI job: `source_lint`)
- `frontend/`: check `docs/agents/frontend.md` and `.circleci/config.yml` for the applicable
  frontend lint and test commands.
