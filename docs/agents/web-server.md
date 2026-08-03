# Web Server

The main application includes an optional Express-based web server that exposes a REST API and serves the React SPA for real-time monitoring. It only starts when `web.port` is present in the YAML configuration.

## Source layout

```
source/lib/common/server/
├── RequestHandler.js             # Abstract base class (shared with dev/app)
├── HandlerConfig.js               # Lazily instantiates an executor class on each request
└── SecuredRequestHandler.js       # Base class for token-secured `/api/*` handlers

source/lib/server/
├── WebServer.js
├── Router.js
├── RouteRegister.js              # Wraps handlers; maps exceptions to HTTP status codes
├── PathValidator.js              # Path-traversal protection
└── handlers/
    ├── AssetsHandler.js
    ├── IndexHandler.js
    ├── JobsFilter.js
    ├── LinksHandler.js
    ├── LogsHandler.js
    ├── SettingsHandler.js
    ├── StatsHandler.js
    ├── api/
    │   ├── ApiConfigHandler.js
    │   ├── ApiEngineStartHandler.js
    │   └── ApiEngineStopHandler.js
    ├── engine/
    │   ├── EngineContinueHandler.js
    │   ├── EnginePauseHandler.js
    │   ├── EngineRestartHandler.js
    │   ├── EngineShutdownHandler.js
    │   ├── EngineStartHandler.js
    │   ├── EngineStatusHandler.js
    │   └── EngineStopHandler.js
    └── jobs/
        ├── JobHandler.js
        ├── JobLogsHandler.js
        ├── JobRetryHandler.js
        └── JobsHandler.js
```

## Routes

Routes are declared declaratively in `Router.js` as a map of path → `HandlerConfig` instance.
`HandlerConfig` holds the executor class and any extra constructor parameters, and lazily
constructs the executor as `(req, res, ...parameters)` only when a matching request arrives.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/settings.json` | Returns `{ "enable_shutdown": true }` when shutdown is enabled; 403 when disabled. |
| `GET` | `/stats.json` | Aggregated worker and job-queue counts. |
| `GET` | `/links.json` | Configured `web.links` plus one link per client (`base_url` and `linkText`/client name). |
| `GET` | `/jobs/:status.json` | Array of jobs in the given status (`enqueued`, `processing`, `failed`, `retryQueue`, `finished`, `dead`). |
| `GET` | `/job/:id.json` | Full detail for a single job; 404 if not found. |
| `GET` | `/engine/status` | Returns `{ status }` with the current engine status. |
| `PATCH` | `/engine/pause` | Sets status → `pausing`. Returns 409 if not `running`. |
| `PATCH` | `/engine/stop` | Sets status → `stopping`, clears queues when workers idle. Returns 409 if not `running`. |
| `PATCH` | `/engine/continue` | Resumes from `paused`. Returns 409 if not `paused`. |
| `PATCH` | `/engine/start` | Starts from `stopped`, or pushes resources into an already-`running` engine. Returns 409 if `paused`/`pausing`/`stopping`. See [below](#engine-start-request-and-response) for the body/response shape. |
| `PATCH` | `/engine/restart` | Stops then restarts (async). Returns 409 if not `running`. |
| `GET` | `/assets/*path` | Serves built frontend assets; rejects path-traversal with 403. |
| `GET` | `/` and `*` | Serves `source/static/index.html` (SPA entry + catch-all). |
| `POST` | `/api/config` | Token-secured. Merges a payload namespace's `resources`/`clients` into the running instance. See [below](#api-namespace). |
| `POST` | `/api/engine/start` | Token-secured. Same semantics as `PATCH /engine/start`, scoped per namespace via `targets`. See [below](#api-namespace). |
| `POST` | `/api/engine/stop` | Token-secured. Identical to `PATCH /engine/stop` (no body). |

The PATCH lifecycle endpoints return immediately with the transitional status and do not wait for workers to finish. Poll `GET /engine/status` to detect when the transition completes.

### `/engine/start` request and response

The request body may name which resources to enqueue:

```json
{
  "resources": ["home_page", "categories"]
}
```

Names refer to entries in the config's top-level `resources:` map. If the body is empty/omitted, all parameter-free resources are enqueued (today's default behavior). Whether the engine was `stopped` (and is now started) or already `running` (resources pushed into the existing queue), the response is:

```json
{
  "status": "running",
  "enqueued": ["home_page"],
  "skippedResources": [
    { "name": "products", "reason": "needs_params" },
    { "name": "unknown_resource", "reason": "not_found" },
    { "name": "legacy_search", "reason": "disabled" }
  ]
}
```

A resource is skipped (never partially enqueued) when its name isn't found in the registry (`not_found`), when any of its requests needs parameters that weren't supplied (`needs_params`), or when any of its requests is marked `disabled: true` / `enabled: false` (`disabled`). When the body is empty/omitted, `enqueued` and `skippedResources` are always empty — the default bulk enqueue works at the request level, not by resource name.

## `/api` namespace

Every `/api/*` route requires a bearer token matching `web.api.token` (see [Configuration](#configuration)), checked by the shared `SecuredRequestHandler` base class: `Authorization: Bearer <web.api.token value>`. A missing/invalid token — or no `web.api.token` configured at all — responds 403. This is a distinct, external-facing namespace from the UI-facing `/engine/*` routes above, reusing the `NamespaceMap.include()`/`NamespaceMapBuilder` runtime-merge machinery to accept config changes without a restart.

### `POST /api/config`

Merges a single namespace's `resources`/`clients` into the running instance — creating the namespace when it doesn't already exist, replacing any resource/client on name clash (the same per-item replace behavior boot-time namespace merging already has). Changes are in-memory only: not persisted to disk, and lost on restart.

```json
{
  "namespace": "reports",
  "clients": {
    "default": { "base_url": "https://example.com", "timeout": 5000 }
  },
  "resources": {
    "categories": [{ "url": "/categories.json", "status": 200 }]
  }
}
```

`resources`/`clients` may each be omitted (defaulting to `{}`). `namespace` is required and must be a non-empty string; a missing/blank `namespace`, a non-object `resources`/`clients`, or a config/registry validation error raised by the merge (e.g. an unresolvable client/action reference) all respond 400 with `{ "error": "<message>" }`. On success:

```json
{ "status": "accepted" }
```

Only when the engine is currently `running`, the param-free resources named in the payload's `resources` (not the whole namespace) are additionally enqueued, the same way `/engine/start` enqueues by name.

### `POST /api/engine/start`

Same start/enqueue semantics as `PATCH /engine/start`, but scoped per namespace via `targets` instead of assuming `default`:

```json
{
  "targets": [
    { "namespace": "reports", "resources": ["categories"] },
    { "namespace": "billing" }
  ]
}
```

Each entry names one namespace and, optionally, specific resource names within it — omitting `resources` for an entry enqueues every param-free resource in that namespace (mirroring the boot-time default, scoped to the namespace). Omitting `targets` entirely falls back to today's default-namespace behavior (top-level `resources`, as `PATCH /engine/start` already accepts). The response aggregates every target's `enqueued`/`skippedResources` into the same flat shape `PATCH /engine/start` already uses:

```json
{
  "status": "running",
  "enqueued": ["categories"],
  "skippedResources": [{ "name": "missing_resource", "reason": "not_found" }]
}
```

Malformed `targets` (missing/non-string `namespace`, or a non-array-of-strings `resources`) responds 400. `ConflictError` (409) applies exactly as it does for `PATCH /engine/start` when the engine is `paused`/`pausing`/`stopping`.

### `POST /api/engine/stop`

Identical to `PATCH /engine/stop` — no body, 409 if not `running`.

## Serialization

**`JobIndexSerializer`** (list view):

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Job identifier. |
| `status` | string | Current status name. |
| `attempts` | number | Number of retry attempts made. |
| `jobClass` | string | Constructor name (e.g. `ResourceRequestJob`). |

**`JobShowSerializer`** (detail view):

| Field | Type | Statuses | Description |
|-------|------|----------|-------------|
| `id` | string | all | Job identifier. |
| `status` | string | all | Current status name. |
| `attempts` | number | all | Retry attempts. |
| `jobClass` | string | all | Constructor name. |
| `arguments` | object | all | Job-specific parameters. |
| `remainingAttempts` | number | `enqueued`, `processing`, `failed` | `maxRetries − attempts`. |
| `readyInMs` | number | `failed` | Milliseconds until eligible for retry. |
| `lastError` | string | `failed`, `dead` | Exception message from the last failure (when present). |
| `backtrace` | string | `failed`, `dead` | Stack trace; present whenever `lastError` is present. |

## Error handling

`RouteRegister` maps domain errors to HTTP status codes: `ForbiddenError` → 403, `NotFoundError` → 404, anything else → 500.

## Configuration

```yaml
web:
  port: 3000
  enable_shutdown: true  # optional, defaults to true
  autostart: true        # optional, defaults to true
  idle_timeout: 900       # optional, seconds; 0/unset disables auto-shutdown (default)
  api:
    token: $NAVI_API_TOKEN  # optional; env-resolved like any other config value
```

When `enable_shutdown` is `false`, `GET /settings.json` returns 403 and the frontend hides the shutdown button.

When `autostart` is `false`, the application boots with the web server running but the engine `stopped` (no jobs enqueued, no allocation happening) until `PATCH /engine/start` is called. This only takes effect when `web.port` is configured — without a web server there's no way to trigger a manual start.

When `idle_timeout` is set to a positive number of seconds, the application auto-shuts-down (web server included, same as `PATCH /engine/shutdown`) once it has gone that long with no busy workers and no jobs in any queue. The countdown starts as soon as the application goes idle and resets any time a job exists or a worker becomes busy again — it is re-evaluated on every `Engine` loop tick rather than tracked by a separate timer. This applies independently of `enable_shutdown`: disabling the manual shutdown button/endpoint does not disable `idle_timeout`. Leaving `idle_timeout` unset (or `0`) preserves the default behavior — the web server lingers indefinitely.

`web.api.token` is the shared bearer token required by every `/api/*` endpoint (see [`/api` namespace](#api-namespace)). It is loaded the same way every other config value is — including via the env-variable resolver (e.g. `$NAVI_API_TOKEN`). Leaving it unset means every `/api/*` request is rejected with 403, since no provided token can ever match — this is the intended safe default, not a bug.
