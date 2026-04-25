# Plan: Add Routes to Webserver

## Overview

Add two new JSON API routes to the Navi webserver — `GET /jobs/:status.json` and `GET /job/:id.json` — so the front-end can display richer job information. The dev proxy must also be configured to forward these routes to the Navi backend. Architecture and flow documentation must be updated accordingly.

## Context

The Navi webserver currently exposes only `GET /stats.json`. The front-end needs two additional endpoints to display job lists filtered by status and individual job details (including last error). Because the JSON data originates from the Navi backend, the dev reverse proxy must be explicitly taught to forward these paths.

## Implementation Steps

### Step 1 — Expose job query methods on `JobRegistry` / `JobRegistryInstance`

Add two new methods:
- `JobRegistry.jobsByStatus(status)` — returns all jobs in the queue that corresponds to the given status (e.g. `enqueued`, `failed`). The status maps to one of the internal collections (`enqueued`, `processing`, `failed`, `retryQueue`, `finished`, `dead`).
- `JobRegistry.jobById(id)` — searches across all collections and returns the job with the matching ID, or `null` if not found.

Each `Job` instance exposes: `id`, `status` (derived from which collection the job lives in), and `attempts`.

### Step 2 — Add `JobsRequestHandler`

Create `source/lib/server/JobsRequestHandler.js` extending `RequestHandler`. It handles `GET /jobs/:status.json` by calling `JobRegistry.jobsByStatus(req.params.status)` and returning the list as JSON. Returns an empty array for an unknown status.

### Step 3 — Add `JobRequestHandler`

Create `source/lib/server/JobRequestHandler.js` extending `RequestHandler`. It handles `GET /job/:id.json` by calling `JobRegistry.jobById(req.params.id)` and returning the job's `{ id, status, attempts }` as JSON. Returns a 404 if no job is found.

### Step 4 — Register the new routes in `Router`

Update `source/lib/server/Router.js` to wire `/jobs/:status.json` to `JobsRequestHandler` and `/job/:id.json` to `JobRequestHandler` via `RouteRegister`.

### Step 5 — Update the dev proxy configuration

Update the Tent-based proxy in `dev/proxy/` to add a forwarding rule that routes all requests ending in `.json` to the Navi backend container. This covers `/stats.json`, `/jobs/:status.json`, and `/job/:id.json` in one rule.

### Step 6 — Write specs

Add spec files:
- `source/spec/lib/registry/JobRegistry_spec.js` — cover the new `jobsByStatus` and `jobById` methods.
- `source/spec/lib/server/JobsRequestHandler_spec.js`
- `source/spec/lib/server/JobRequestHandler_spec.js`

Follow the existing pattern from `StatsRequestHandler_spec.js`.

### Step 7 — Update documentation

Update the relevant docs under `docs/agents/` to reflect the new routes:
- `docs/agents/flow.md` — add the two new routes to the web UI routes section.
- `docs/agents/architecture.md` — add `JobsRequestHandler` and `JobRequestHandler` to the `server/` module table.
- `docs/agents/dev-proxy.md` — document the new forwarding rules.

## Files to Change

- `source/lib/registry/JobRegistry.js` / `JobRegistryInstance.js` — add `jobsByStatus(status)` and `jobById(id)` methods
- `source/lib/server/JobsRequestHandler.js` — new handler for `/jobs/:status.json`
- `source/lib/server/JobRequestHandler.js` — new handler for `/job/:id.json`
- `source/lib/server/Router.js` — register the two new routes
- `source/spec/lib/registry/JobRegistry_spec.js` — cover the new registry methods
- `source/spec/lib/server/JobsRequestHandler_spec.js` — specs for the new handler
- `source/spec/lib/server/JobRequestHandler_spec.js` — specs for the new handler
- `dev/proxy/<config file>` — add `*.json` forwarding rule to the Navi backend
- `docs/agents/flow.md` — document new routes
- `docs/agents/architecture.md` — document new handler classes and registry methods
- `docs/agents/dev-proxy.md` — document the `*.json` proxy forwarding rule

## Notes

- Job response shape: `{ id, status, attempts }`. `status` is derived from which collection the job currently lives in.
- Unknown status → empty array (200). Non-existent job ID → 404.
- The proxy rule `*.json → backend` also covers the existing `/stats.json` route, which is fine.
