# Web Server

The main application includes an optional Express-based web server that exposes a REST API and serves the React SPA for real-time monitoring. It only starts when `web.port` is present in the YAML configuration.

## Source layout

```
source/lib/server/
├── WebServer.js
├── Router.js
├── RouteRegister.js              # Wraps handlers; maps exceptions to HTTP status codes
├── PathValidator.js              # Path-traversal protection
├── RequestHandler.js             # Abstract base class
└── handlers/
    ├── AssetsRequestHandler.js
    ├── IndexRequestHandler.js
    ├── JobsFilter.js
    ├── LogsRequestHandler.js
    ├── SettingsRequestHandler.js
    ├── StatsRequestHandler.js
    ├── engine/
    │   ├── EngineContinueRequestHandler.js
    │   ├── EnginePauseRequestHandler.js
    │   ├── EngineRestartRequestHandler.js
    │   ├── EngineShutdownRequestHandler.js
    │   ├── EngineStartRequestHandler.js
    │   ├── EngineStatusRequestHandler.js
    │   └── EngineStopRequestHandler.js
    └── jobs/
        ├── JobLogsRequestHandler.js
        ├── JobRequestHandler.js
        ├── JobRetryRequestHandler.js
        └── JobsRequestHandler.js
```

## Routes

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
| `PATCH` | `/engine/start` | Starts from `stopped`. Returns 409 if not `stopped`. |
| `PATCH` | `/engine/restart` | Stops then restarts (async). Returns 409 if not `running`. |
| `GET` | `/assets/*path` | Serves built frontend assets; rejects path-traversal with 403. |
| `GET` | `/` and `*` | Serves `source/static/index.html` (SPA entry + catch-all). |

The PATCH lifecycle endpoints return immediately with the transitional status and do not wait for workers to finish. Poll `GET /engine/status` to detect when the transition completes.

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
```

When `enable_shutdown` is `false`, `GET /settings.json` returns 403 and the frontend hides the shutdown button.
