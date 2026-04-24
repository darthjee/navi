# Plan: Add Dev App Frontend

## Overview

Create a React + Vite frontend application under `dev/frontend/`, wire it into the Docker Compose stack so its build output is shared with the dev proxy, configure the proxy to serve static assets and fall back to `index.html` for SPA routing, add CI jobs with coverage reporting, and update `docs/agents/` documentation.

## Context

The dev app (`dev/app`) only exposes JSON endpoints. To enable true end-to-end testing of the full stack, a frontend is needed. The frontend is built with Vite and served by the existing dev proxy (`dev/proxy`). The proxy already forwards all requests to `dev/app`; this plan extends it to distinguish `.json` requests (forwarded to `dev/app`) from all others (served as static files with SPA fallback). Pages fetch data from `dev/app` via `dev/proxy` using `.json` requests.

## Parts

- [Frontend Application](plan_frontend.md) — Vite + React app structure, pages, clients
- [Tests](plan_tests.md) — Jasmine test scenarios and code snippets
- [Proxy Configuration](plan_proxy.md) — Tent rules for static serving and SPA fallback
- [Docker](plan_docker.md) — New service and Dockerfile
- [CI](plan_ci.md) — New CircleCI jobs with Codacy coverage reporting
- [Documentation](plan_docs.md) — Updates to `docs/agents/`

## Files to Change

- `dev/frontend/` — new directory (see [plan_frontend.md](plan_frontend.md))
- `dev/proxy/rules/backend.php` — restrict to `.json` requests only
- `dev/proxy/rules/frontend.php` — new: static file serving + SPA fallback (see [plan_proxy.md](plan_proxy.md))
- `dev/proxy/configure.php` — require the new rule file
- `docker-compose.yml` — add `navi_dev_frontend` service (see [plan_docker.md](plan_docker.md))
- `dockerfiles/dev_frontend_app/Dockerfile` — new Dockerfile for `dev/frontend`
- `.circleci/config.yml` — add `jasmine-dev-frontend` and `checks-dev-frontend` (see [plan_ci.md](plan_ci.md))
- `docs/agents/` — update architecture, flow, dev-app docs (see [plan_docs.md](plan_docs.md))

## Notes

- `dev/frontend` is distinct from `frontend/` (the main Navi web UI). Both coexist.
- The Vite `dist/` output is bind-mounted as `dev/proxy/static/` so the proxy serves the built assets without a copy step.
- SPA fallback must only apply to non-`.json` paths to avoid serving `index.html` for API calls.
