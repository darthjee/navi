# Issue: Add Dev App Frontend

## Description

The dev app currently lacks a frontend, which prevents truly testing it end-to-end. A new React-based frontend application (built with Vite) needs to be added under `dev/frontend/`. Its build output is mounted into `dev/proxy/static/`, allowing the dev proxy to serve static assets for non-JSON requests while routing JSON requests to `dev/app`.

## Problem

- The dev app cannot be fully tested without a real frontend.
- There is no `dev/frontend/` application yet.
- Static files are not being served through the dev proxy.

## Expected Behavior

- A `dev/frontend/` React + Vite application exists and can be built.
- The build output folder is mounted via Docker Compose into `dev/proxy/static/`.
- The dev proxy serves static files (non-`.json` requests) from `dev/proxy/static/`.
- JSON requests continue to be forwarded to `dev/app`.

## Solution

- Create `dev/frontend/` as a new Vite + React application.
- Configure the build output directory to `dev/proxy/static/` (or mount it there via Docker Compose).
- Add the following pages/routes:
  - Index page `/`
  - Categories index page `/categories`
  - Category page `/categories/:id`
  - Category items index page `/categories/:id/items`
  - Category item page `/categories/:category_id/items/:id`
- Include a shared JS entry point and a shared CSS file using Bootstrap.
- Update `docker-compose` to mount the build output into `dev/proxy/static/`.

## Benefits

- Enables true end-to-end testing of the dev app stack.
- Makes the local development environment closer to a real production setup.
- Allows Navi's cache-warming behaviour to be verified against actual HTML/JS/CSS assets.

---
See issue for details: https://github.com/darthjee/navi/issues/342
