# Web Server

The main application includes an optional Express-based web server that exposes a REST API and serves the React SPA for real-time monitoring. It only starts when `web.port` is present in the YAML configuration.

## Source layout

```
source/lib/common/server/
├── RequestHandler.js             # Abstract base class (shared with dev/app)
└── RequestHandler.js     # Abstract executor base class

source/lib/server/
├── WebServer.js
├── Router.js
├── RouteRegister.js              # Wraps handlers; maps exceptions to HTTP status codes
├── HandlerConfig.js              # Lazily instantiates an executor class on each request
├── PathValidator.js              # Path-traversal protection
└── handlers/
    ├── AssetsHandler.js
    ├── IndexHandler.js
    ├── JobsFilter.js
    ├── LinksHandler.js
    ├── LogsHandler.js
    ├── SettingsHandler.js
    ├── StatsHandler.js
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
    { "name": "unknown_resource", "reason": "not_found" }
  ]
}
```

A resource is skipped (never partially enqueued) when its name isn't found in the registry (`not_found`) or when any of its requests needs parameters that weren't supplied (`needs_params`). When the body is empty/omitted, `enqueued` and `skippedResources` are always empty — the default bulk enqueue works at the request level, not by resource name.

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
```

When `enable_shutdown` is `false`, `GET /settings.json` returns 403 and the frontend hides the shutdown button.

When `autostart` is `false`, the application boots with the web server running but the engine `stopped` (no jobs enqueued, no allocation happening) until `PATCH /engine/start` is called. This only takes effect when `web.port` is configured — without a web server there's no way to trigger a manual start.
