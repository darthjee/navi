# Plan: Add Jobs to Front-end

## Overview

Add two new screens to the Navi front-end — a job list at `/#/jobs` and a job detail at `/#/job/:id` — consuming the JSON API provided by the Navi webserver. Update the dev proxy to forward `*.json` requests to the backend, and update documentation with examples of the new screens.

## Context

The Navi webserver exposes (or will expose, per issue #352) `GET /jobs.json` and `GET /job/:id.json`. The front-end is a React + Vite SPA that already uses Bootstrap. The dev proxy must be configured to forward JSON requests to the Navi backend rather than serving them statically.

## Implementation Steps

### Step 1 — Add the `Jobs` screen

Create a new React component for `/#/jobs` that:
- Fetches `/jobs.json` on mount.
- Renders a list of jobs using Bootstrap table or list-group components.
- Handles loading and error states.

### Step 2 — Add the `Job` detail screen

Create a new React component for `/#/job/:id` that:
- Reads the `:id` from the route params.
- Fetches `/job/:id.json` on mount.
- Renders the job's details (`id`, `status`, `attempts`) using Bootstrap components.
- Handles loading, error, and not-found states.

### Step 3 — Register the new routes

Add `/#/jobs` and `/#/job/:id` to the front-end router so they render the new components.

### Step 4 — Update the dev proxy

Add a forwarding rule in `dev/proxy/` so that all requests ending in `.json` are forwarded to the Navi backend container.

### Step 5 — Update documentation

Update the following files to mention the new job screens:
- `README.md`
- `DOCKERHUB_DESCRIPTION.md`
- `source/README.md`

## Files to Change

- `frontend/src/` — new `Jobs` and `Job` components + route registrations
- `dev/proxy/<config file>` — add `*.json` forwarding rule
- `README.md` — document new job screens
- `DOCKERHUB_DESCRIPTION.md` — document new job screens
- `source/README.md` — document new job screens

## Notes

- This issue depends on issue #352 (Add routes to webserver) for the backend endpoints.
- React and Bootstrap are expected to already be present in the `frontend/` package — confirm before adding dependencies.
- The `*.json` proxy rule also covers `/stats.json`, which is fine.
- Need to confirm the exact front-end router setup (e.g., React Router) and where routes are currently declared.
