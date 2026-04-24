# Issue: Add Dev App Frontend

## Description

The dev app currently lacks a frontend, which prevents truly testing it end-to-end. A new React-based frontend application (built with Vite) needs to be added under `dev/frontend/`. Its `dist/` build output is mounted via Docker Compose as `dev/proxy/static/`, allowing the dev proxy to serve static assets for non-JSON requests while routing `.json` requests to `dev/app`. The frontend pages consume data from `dev/app` by making `.json` requests through `dev/proxy`.

## Problem

- The dev app cannot be fully tested without a real frontend.
- There is no `dev/frontend/` application yet.
- Static files are not being served through the dev proxy.
- The proxy is not configured to handle SPA (single-page app) fallback routing.

## Expected Behavior

- A `dev/frontend/` React + Vite application exists and can be built.
- Docker Compose mounts `dev/proxy/static/` into the `navi_dev_frontend` container at `/home/node/app/dist`, so the Vite build output (`dist/`) is shared with the proxy.
- The dev proxy serves static files (non-`.json` requests) from `dev/proxy/static/`, with a SPA fallback that serves `index.html` for unmatched paths.
- `.json` requests continue to be forwarded to `dev/app`.
- The frontend pages fetch data via `dev/proxy` (e.g. `/categories.json`), which in turn proxies them to `dev/app`.

## Solution

- Create `dev/frontend/` as a new Vite + React application.
- Add the following pages/routes:
  - Index page `/`
  - Categories index page `/categories`
  - Category page `/categories/:id`
  - Category items index page `/categories/:id/items`
  - Category item page `/categories/:category_id/items/:id`
- Include a shared JS entry point and a shared CSS file using Bootstrap.
- Configure `docker-compose` to mount `dev/proxy/static/` at `/home/node/app/dist` inside the `navi_dev_frontend` container.
- Configure the dev proxy to:
  - Serve static files from `dev/proxy/static/`.
  - Forward `.json` requests to `dev/app`.
  - Fall back to `index.html` for all other non-matched requests (SPA routing support).
- Update `.circleci/config.yml` to add two new CI jobs:
  - `jasmine-dev-frontend`: runs the frontend test suite.
  - `checks-dev-frontend`: runs linting and other static checks for the frontend.

## Benefits

- Enables true end-to-end testing of the dev app stack.
- Makes the local development environment closer to a real production setup.
- Allows Navi's cache-warming behaviour to be verified against actual HTML/JS/CSS assets.

---
See issue for details: https://github.com/darthjee/navi/issues/342
