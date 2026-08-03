# Issue: Allow external updates

## Description
We want to add a token-secured `/api` namespace so external systems can push new resource configuration into a running Navi instance, and start/stop engine processing, without requiring a restart or editing the on-disk config file.

## Problem
Resources and clients can currently only be introduced through the YAML config file, resolved at boot time (optionally split across multiple included files, per #601/#613). There is no way for an external system to add or update a namespace's resources/clients, or to control engine start/stop, while Navi is already running — the existing `/engine/*` endpoints are UI-facing and unauthenticated.

## Expected Behavior
Three token-secured endpoints under a new `/api` prefix let external systems manage a running Navi instance:

- `POST /api/config` merges a single namespace's `resources`/`clients` into the running instance (name clashes replace the existing definition; unknown namespaces are created on the fly), then, only if the engine is currently running, enqueues the param-free resources among those just added/updated.
- `POST /api/engine/start` starts the engine (if stopped) or enqueues additional jobs (if already running), scoped per namespace via the payload.
- `POST /api/engine/stop` stops the engine, identical to the existing `PATCH /engine/stop` (no body).

All three:

- Require a bearer token matching `web.api.token` in config (loadable via the existing env-variable resolver), checked by a shared `SecuredRequestHandler` base class. Missing/invalid token results in 403.
- Malformed/invalid payload results in 4xx.
- Changes made through `/api/config` are in-memory only and do not survive a restart.
- Responses only confirm acceptance/status — no echoing of the resulting config or full enqueue details beyond what the existing `/engine/*` endpoints already return.

## Solution

### Endpoints

Three endpoints, all under the new `/api` prefix — reserved for future external-facing/secured APIs, separate from the existing UI-facing routes (`/settings.json`, `/engine/*`, etc.):

- `POST /api/config`
- `POST /api/engine/start`
- `POST /api/engine/stop`

### Security

- Token-based, shared across every `/api/*` endpoint. The token lives under `web.api.token` in config (loadable via the existing env-variable resolver, same as other config values).
- Checked by a new handler type — a `SecuredRequestHandler` (or similar) base class that each concrete `/api/*` handler extends — since more token-secured endpoints are expected under `/api` in the future.
- Missing/invalid token reuses the existing `ForbiddenError` -> 403 path already wired in `RouteRegister`.

### POST /api/config

Payload is the same shape the YAML config already supports (this repo's recent #601/#613 work already lets a namespace be assembled from multiple sources and merged into an already-running `NamespaceMap`, so the payload reuses that machinery rather than needing new parsing logic), scoped to exactly one namespace per call:

- `namespace`
- `resources`
- `clients`

#### Example

```
POST /api/config
Authorization: Bearer <web.api.token value>
Content-Type: application/json
```

```json
{
  "namespace": "reports",
  "clients": {
    "default": {
      "base_url": "https://example.com",
      "timeout": 5000
    }
  },
  "resources": {
    "categories": [
      { "url": "/categories.json", "status": 200 }
    ]
  }
}
```

Success response (202/200, to be settled at planning time):

```json
{ "status": "accepted" }
```

Exact header name/scheme for the token (`Authorization: Bearer`, a custom `X-API-Token`, etc.) is left open for planning.

#### Merge semantics

The payload is added into the target namespace, creating it if it doesn't already exist. On a name clash (resource or client already present), the incoming definition replaces the existing one — the same per-item replace behavior `NamespaceMapBuilder` already implements for boot-time namespace merging.

#### Auto-trigger on add

Only when the engine is currently running: after the payload is merged in, the param-free resources among those just added/updated are enqueued (mirroring the boot-time `ApplicationInstance#enqueueFirstJobs` strategy), scoped to only what this call touched — not the whole registry. When the engine is stopped/paused, the config is still merged, but nothing is auto-enqueued.

#### Validation & errors

Follow the existing exception -> HTTP status pattern (`RouteRegister#handleError`): malformed/invalid payloads (bad YAML shape, unresolvable client/action references, etc.) map to 4xx responses, mirroring how `ConfigParser`/`NamespaceMapBuilder` already raise typed errors at boot time.

#### Persistence

In-memory only — added/updated config is lost on restart. It is not written back to disk or folded into the include chain.

### POST /api/engine/start

Same start/enqueue semantics as the existing `PATCH /engine/start` (starts the engine if stopped, or enqueues additional jobs if already running; `ConflictError` -> 409 otherwise), but payload targets are scoped per namespace instead of assuming `default`:

```json
{
  "targets": [
    { "namespace": "reports", "resources": ["categories"] },
    { "namespace": "billing" }
  ]
}
```

- Each entry names one namespace and, optionally, specific resource names within it.
- When `resources` is omitted for an entry, every param-free resource in that namespace is enqueued (mirroring boot-time behavior, scoped to the namespace).
- Omitting `targets` entirely falls back to today's default-namespace behavior (`resources` at the top level, as `PATCH /engine/start` already accepts).

### POST /api/engine/stop

Identical to the existing `PATCH /engine/stop`: no body, stops the engine entirely (`ConflictError` -> 409 if not running).

## Benefits
- Lets external systems dynamically register/update resource configuration and control engine start/stop without a Navi restart.
- Establishes an `/api` namespace and a reusable `SecuredRequestHandler` pattern for future token-secured endpoints.
