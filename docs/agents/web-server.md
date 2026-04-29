# Web Server

The main application includes an optional Express-based web server that exposes a **read-only REST API** and serves the React SPA for real-time monitoring of cache-warming jobs and worker status. It only starts when `web.port` is present in the YAML configuration.

## Startup

`Application` initialises the web server during `loadConfig()`:

1. Parses YAML via `Config.fromFile(configPath)`.
2. Initialises global registries: `JobRegistry`, `WorkersRegistry`, `JobFactory`.
3. Calls `WebServer.build({ webConfig })` — returns `null` when `web` is absent from the config, so the server is entirely optional.
4. Starts the engine and the web server concurrently.

## Source layout

```
source/lib/server/
├── WebServer.js                  # Express app + listen
├── Router.js                     # Route registration + static-file serving
├── RouteRegister.js              # Wraps handlers; maps exceptions to HTTP status codes
├── handlers/
│   ├── RequestHandler.js         # Abstract base class
│   ├── StatsRequestHandler.js    # GET /stats.json
│   ├── JobsRequestHandler.js     # GET /jobs/:status.json
│   ├── JobRequestHandler.js      # GET /job/:id.json
│   ├── IndexRequestHandler.js    # Serves index.html (SPA entry / catch-all)
│   └── AssetsRequestHandler.js  # Serves built frontend assets
├── serializers/
│   ├── JobSerializer.js          # Dispatcher: index vs show view
│   ├── JobIndexSerializer.js     # Lightweight job representation (list view)
│   └── JobShowSerializer.js      # Full job representation (detail view)
└── validators/
    └── PathValidator.js          # Path-traversal protection for asset serving
```

## Class responsibilities

| Class | Responsibility |
|-------|---------------|
| `WebServer` | Creates the Express app, delegates routing to `Router`, exposes `start()` to begin listening on the configured port. |
| `Router` | Registers all route handlers via `RouteRegister`, mounts `express.static` for the `source/static/` directory, and adds a catch-all that falls back to `IndexRequestHandler`. |
| `RouteRegister` | Wraps each handler's `handle()` call in a try/catch and maps `ForbiddenError` → 403, `NotFoundError` → 404, and everything else → 500. |
| `RequestHandler` | Abstract base; subclasses implement `handle(req, res)`. |

## Routes

| Method | Path | Handler | Description |
|--------|------|---------|-------------|
| `GET` | `/stats.json` | `StatsRequestHandler` | Aggregated worker and job-queue counts. |
| `GET` | `/jobs/:status.json` | `JobsRequestHandler` | Array of jobs in the given status (`enqueued`, `processing`, `failed`, `finished`, `dead`). |
| `GET` | `/job/:id.json` | `JobRequestHandler` | Full detail for a single job; 404 if not found. |
| `GET` | `/clients/base_urls.json` | `BaseUrlsRequestHandler` | Unique list of client base URLs from `ClientRegistry`. |
| `GET` | `/engine/status` | `EngineStatusRequestHandler` | Returns `{ status }` with the current engine status string. |
| `PATCH` | `/engine/pause` | `EnginePauseRequestHandler` | Sets status → `pausing`, stops the engine. Returns `{ status: 'pausing' }`. Returns `409` if not `running`. |
| `PATCH` | `/engine/stop` | `EngineStopRequestHandler` | Sets status → `stopping`, stops the engine, clears queues when workers idle. Returns `{ status: 'stopping' }`. Returns `409` if not `running`. |
| `PATCH` | `/engine/continue` | `EngineContinueRequestHandler` | Resumes from `paused` — creates a new engine. Returns `{ status: 'running' }`. Returns `409` if not `paused`. |
| `PATCH` | `/engine/start` | `EngineStartRequestHandler` | Starts from `stopped` — creates a new engine, re-enqueues initial jobs. Returns `{ status: 'running' }`. Returns `409` if not `stopped`. |
| `PATCH` | `/engine/restart` | `EngineRestartRequestHandler` | Stops then re-starts the engine (async). Returns `{ status: 'stopping' }`. Returns `409` if not `running`. |
| `GET` | `/assets/*path` | `AssetsRequestHandler` | Serves built frontend assets; rejects path-traversal attempts with 403. |
| `GET` | `/` | `IndexRequestHandler` | Serves `source/static/index.html`. |
| `GET` | `*` | `IndexRequestHandler` | SPA catch-all — serves `index.html` for client-side routes. |

### Engine lifecycle endpoints

The PATCH endpoints that trigger async transitions (`pause`, `stop`, `restart`) return **immediately** with the transitional status (`pausing` or `stopping`). They do not wait for workers to finish. The client should poll `GET /engine/status` to detect when the transition completes.

Valid status transitions:

| From | Action | To (transitional) | Final |
|------|--------|-------------------|-------|
| `running` | `PATCH /engine/pause` | `pausing` | `paused` |
| `running` | `PATCH /engine/stop` | `stopping` | `stopped` |
| `running` | `PATCH /engine/restart` | `stopping` → `running` | — |
| `paused` | `PATCH /engine/continue` | — | `running` |
| `stopped` | `PATCH /engine/start` | — | `running` |

## Data sources

All handlers read from global singletons populated before the server starts:

- **`JobRegistry`** — job queues: enqueued, processing, failed, retryQueue, finished, dead.
- **`WorkersRegistry`** — worker pool state: idle and busy workers.

## Serialization

`JobSerializer` dispatches to one of two serializers depending on the view:

**`JobIndexSerializer`** (list view — lightweight):

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Job identifier. |
| `status` | string | Current status name. |
| `attempts` | number | Number of retry attempts made. |
| `jobClass` | string | Constructor name (e.g. `ResourceRequestJob`). |

**`JobShowSerializer`** (detail view — full):

Fields are included conditionally based on the job's status and whether an error has been recorded.

| Field | Type | Statuses | Description |
|-------|------|----------|-------------|
| `id` | string | all | Job identifier. |
| `status` | string | all | Current status name. |
| `attempts` | number | all | Number of retry attempts made. |
| `jobClass` | string | all | Constructor name. |
| `arguments` | object | all | Job-specific parameters. |
| `remainingAttempts` | number | `enqueued`, `processing`, `failed` | `maxRetries − attempts`. |
| `readyInMs` | number | `failed` | Milliseconds until the job is eligible for retry. |
| `lastError` | string | `failed`, `dead` | Exception message from the last recorded failure; omitted when no error has been recorded. |
| `backtrace` | string | `failed`, `dead` | Stack trace of the last error; present whenever `lastError` is present. Never included in index views. |

## Error handling

`RouteRegister` maps domain errors to HTTP status codes:

| Exception | HTTP status |
|-----------|-------------|
| `ForbiddenError` | 403 |
| `NotFoundError` | 404 |
| Anything else | 500 — "Internal Server Error" |

## Static-file serving and path-traversal protection

`Router` mounts `express.static` on `source/static/` to serve the pre-built frontend. `AssetsRequestHandler` additionally guards the `/assets/*path` route: `PathValidator` inspects the resolved path and throws `ForbiddenError` if it escapes the static directory.

## Configuration

The server is configured via the `web` key in the YAML config file:

```yaml
web:
  port: 3000
```

If the `web` key is absent, `WebServer.build()` returns `null` and no server is started.
