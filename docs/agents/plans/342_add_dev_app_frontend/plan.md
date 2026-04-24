# Plan: Add Dev App Frontend

## Overview

Create a React + Vite frontend application under `dev/frontend/`, wire it into the Docker Compose stack so its build output is shared with the dev proxy, configure the proxy to serve static assets and fall back to `index.html` for SPA routing, and add CI jobs for tests and lint.

## Context

The dev app (`dev/app`) only exposes JSON endpoints. To enable true end-to-end testing of the full stack, a frontend is needed. The frontend is built with Vite and served by the existing dev proxy (`dev/proxy`). The proxy already forwards `.json` requests to `dev/app`; this plan extends it to also serve static files and handle SPA navigation. The frontend pages fetch data from `dev/proxy` using `.json` requests.

## Implementation Steps

### Step 1 — Scaffold `dev/frontend/` as a Vite + React app

Create a new Vite + React project under `dev/frontend/`. The app should:
- Use React Router for client-side routing.
- Include a shared CSS entry point that imports Bootstrap.
- Include a shared JS entry point for common utilities or setup.
- Be configured to build output to the default `dist/` folder (Docker Compose will handle the mount).

### Step 2 — Implement the five pages

Add the following route/page components:

| Route | Component |
|-------|-----------|
| `/` | `IndexPage` |
| `/categories` | `CategoriesIndexPage` |
| `/categories/:id` | `CategoryPage` |
| `/categories/:id/items` | `CategoryItemsIndexPage` |
| `/categories/:category_id/items/:id` | `CategoryItemPage` |

Each page fetches its data from `dev/proxy` using `.json` requests (e.g. `GET /categories.json`, `GET /categories/1.json`).

### Step 3 — Add tests and lint to `dev/frontend/`

Following the patterns used in `dev/app` and `dev/proxy`:
- Configure **Jasmine** for unit/component tests.
- Configure **ESLint** for linting.
- Add `yarn test` and `yarn lint` scripts to `dev/frontend/package.json`.

### Step 4 — Configure Docker Compose

In `docker-compose.yml`, add a `navi_dev_frontend` service that:
- Mounts `dev/proxy/static/` at `/home/node/app/dist` inside the container, so the Vite build output is available to the proxy.
- Runs the Vite build (or dev server) as appropriate.

### Step 5 — Configure the dev proxy

In `dev/proxy/`, extend the proxy configuration to:
- Serve static files from `dev/proxy/static/` for all non-`.json` requests.
- Continue to forward `.json` requests to `dev/app`.
- Fall back to `index.html` for any non-matched path (SPA routing support).

### Step 6 — Update CircleCI configuration

In `.circleci/config.yml`, add two new jobs:
- `jasmine-dev-frontend`: runs `yarn test` inside the `dev/frontend/` Docker container. Must also report coverage results (to the same coverage service used by the other test jobs, e.g. Codacy or Codecov).
- `checks-dev-frontend`: runs `yarn lint` (and any other static checks) inside the `dev/frontend/` Docker container.

Both jobs should follow the same structure as the existing `jasmine-dev-app` and `checks-dev-app` (or equivalent) jobs, including coverage reporting for the test job.

### Step 7 — Update `docs/agents/` documentation

Update the relevant documentation files under `docs/agents/` to reflect the new frontend:
- Mention `dev/frontend/` in the architecture/overview docs (folder layout, tech stack, purpose).
- Document the data flow: browser → `dev/proxy` → `dev/app` (for `.json`) or `dev/proxy/static/` (for assets).
- Document the Docker Compose setup for the frontend service.
- Document how to run and test `dev/frontend/` locally.

## Files to Change

- `dev/frontend/` — new directory: Vite + React app, pages, tests, lint config, `package.json`
- `dev/proxy/` — extend proxy rules: static file serving, SPA fallback
- `docker-compose.yml` — add `navi_dev_frontend` service with the volume mount
- `.circleci/config.yml` — add `jasmine-dev-frontend` (with coverage reporting) and `checks-dev-frontend` jobs
- `docs/agents/` — update architecture/overview, data flow, Docker setup, and local dev instructions to include `dev/frontend/`

## Notes

- The Vite `dist/` output directory must be bind-mounted (not a named volume) so changes are reflected immediately in the proxy container without a restart.
- The proxy SPA fallback must only apply to non-`.json` paths; otherwise API calls would receive `index.html` instead of JSON.
- The exact structure of the existing proxy config (`dev/proxy/`) is not yet inspected — the proxy step may require reading the current Tent/Nginx/Express config before implementation.
- It is not yet defined whether `dev/frontend/` will run a Vite dev server (with HMR) or only a static build in the Docker Compose stack. This should be clarified before Step 4.
