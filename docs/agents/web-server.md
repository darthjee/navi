# Web Server

The main application includes an optional Express-based web server that exposes a REST API and serves the React SPA for real-time monitoring. It only starts when `web.port` is present in the YAML configuration.

## Source layout

```
source/lib/common/server/
├── RequestHandler.js             # Abstract base class (shared with dev/app)
└── HandlerConfig.js               # Lazily instantiates an executor class on each request

source/lib/server/
├── WebServer.js
├── Router.js
├── RouteRegister.js              # Wraps handlers; maps exceptions to HTTP status codes
├── PathValidator.js              # Path-traversal protection
├── SecuredRequestHandler.js      # Base class for token-secured `/api/*` handlers
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
    ├── memory/
    │   └── MemoryStatusHandler.js
    ├── emissions/
    │   └── EmissionsHandler.js
    ├── extractions/
    │   └── ExtractionsHandler.js
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
| `GET` | `/stats.json` | Aggregated worker and job-queue counts, plus crawler `emissions` counters. |
| `GET` | `/emissions.json` | Crawler emission tracking: aggregate counters plus a paginated ring buffer of per-emission records. |
| `GET` | `/extractions.json` | Crawler extraction tracking: `counts.extracted` plus a paginated ring buffer of per-extraction records. |
| `GET` | `/links.json` | Configured `web.links` plus one link per client (`base_url` and `linkText`/client name). |
| `GET` | `/jobs/:status.json` | Array of jobs in the given status (`enqueued`, `processing`, `failed`, `retryQueue`, `finished`, `dead`). |
| `GET` | `/job/:id.json` | Full detail for a single job; 404 if not found. |
| `GET` | `/engine/status` | Returns `{ status }` with the current engine status. |
| `GET` | `/memory/status.json` | Current process RSS against the resolved `web.memory` maximum, plus a derived `status`. |
| `GET` | `/memory/history.json` | Paginated, oldest-first buffer of recent RSS memory readings (cursor pagination via last_id, same as /logs.json). |
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

### `GET /memory/status.json`

Returns the current process's RSS memory usage against the resolved maximum:

```json
{
  "current": 104857600,
  "maximum": 2147483648,
  "percentage": 4.88,
  "status": "low"
}
```

`current` is the process's current RSS, in bytes. `maximum` is the resolved `web.memory.maximum` (see below). `percentage` is `current / maximum * 100`. `status` is derived from `percentage` against `web.memory.thresholds` (`low`, `medium`, `high`, `over`) using **inclusive** (`>=`) boundaries checked from the top down — e.g. `percentage == 50.0` with `medium: 50.0` is already `"medium"`; percentages below `low` still resolve to `"low"`, since it's the floor status and there is no band beneath it.

`maximum` is resolved via a fallback chain, the first source that yields a value wins: **`web.memory.maximum` (config) → cgroup v2 limit (`memory.max`) → cgroup v1 limit (`memory.limit_in_bytes`) → OS total memory (`os.totalmem()`)**. Cgroup v2 reports the literal string `"max"`, and cgroup v1 reports a very large sentinel number, when unbounded — both are treated as "no limit" and fall through to the next source in the chain. `os.totalmem()` never fails, so the chain always resolves to some maximum.

### `GET /memory/history.json`

Returns a paginated, oldest-first slice of the in-memory RSS reading buffer sampled by
`MemorySampler` (see [Configuration](#configuration)):

```json
[
  {
    "id": 1,
    "value": 104857600,
    "percentage": 4.88,
    "timestamp": "2026-08-30T12:00:00.000Z"
  }
]
```

Pass `?last_id=<id>` to page forward from a known record id (cursor pagination, the same
semantics as `/logs.json` / `/emissions.json`); an unknown id yields an empty array. `value`
is the process's RSS, in bytes, at sample time. `percentage` is `value / maximum * 100`,
relative to the same resolved `web.memory.maximum` used by `/memory/status.json`. `timestamp`
is an ISO 8601 string. The response is capped at `web.memory.data_store.page_size` entries
per request.

### `GET /emissions.json`

Reports the crawler's EmitJob emission tracking — the aggregate counters and a paginated,
newest-truncated ring buffer of per-emission records:

```json
{
  "counts": { "extracted": 128, "emitted": 120, "failed": 5, "dead": 3 },
  "emissions": [
    {
      "id": 1,
      "extractionId": 7,
      "status": "success",
      "url": "https://hooks.example.com/items/42",
      "method": "POST",
      "httpStatus": 200,
      "error": null,
      "itemRef": 42,
      "timestamp": "2026-08-30T12:00:00.000Z"
    }
  ]
}
```

`counts.extracted` is every item produced by an `ExtractionJob` (whether or not it had an
`emit` config); `emitted` / `failed` / `dead` count emission outcomes. `status` on a record
is `success` (accepted response), `failed` (a retryable error — the job will be retried) or
`dead` (retries exhausted, or a non-retryable 4xx). `itemRef` is a compact reference to the
emitted item (its `id` field when present, otherwise `null`) — never the full payload.
`error` is the stringified failure (or `null`). `extractionId` is the `id` of the
`GET /extractions.json` record whose items produced this emission, or `null` when it cannot
be traced (e.g. the extraction was evicted from its ring buffer, or the registry was not built).

`emissions` is ordered oldest-first, capped at `web.logs_page_size` records (default 20,
shared with `/logs.json`). Pass `?last_id=<id>` to page forward from a known record id;
an unknown id yields an empty `emissions` list. The counters are exact for the whole run
even after old records are evicted from the ring buffer. Both the ring buffer and the
counters reset when the engine stops.

### `GET /extractions.json`

Reports the crawler's `ExtractionJob` run tracking — one record per extraction run (not per
item) plus a monotonic extracted-item counter:

```json
{
  "counts": { "extracted": 128 },
  "extractions": [
    {
      "id": 1,
      "parserType": "json_path",
      "originUrl": "https://example.com/list?page=1",
      "itemCount": 20,
      "timestamp": "2026-08-30T12:00:00.000Z"
    }
  ]
}
```

`counts.extracted` is the monotonic sum of every record's `itemCount` for the run (exact
past ring-buffer eviction), mirroring the meaning of `emissions.counts.extracted` on
`GET /emissions.json`. `parserType` is the resolved parser (`regex`, `json_path`, `css`).
`originUrl` is the URL of the `ResourceRequestJob` that triggered the extraction, or `null`
when none was threaded through. `itemCount` is the number of items the parser produced.

`extractions` is ordered oldest-first, capped at `web.logs_page_size` records (default 20,
shared with `/logs.json` and `/emissions.json`). Pass `?last_id=<id>` to page forward from a
known record id; an unknown id yields an empty `extractions` list. The store is sized by the
top-level `extraction.size` config key (default 100). Both the ring buffer and the counter
reset when the engine stops.

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

**`LogSerializer`** flattens `Log` entries for `GET /logs.json`; **`EmissionSerializer`**
does the same for `EmissionRecord` entries in the `emissions` array of `GET /emissions.json`
(`id`, `extractionId`, `status`, `url`, `method`, `httpStatus`, `error`, `itemRef`, `timestamp`);
**`ExtractionSerializer`** does the same for `ExtractionRecord` entries in the `extractions`
array of `GET /extractions.json` (`id`, `parserType`, `originUrl`, `itemCount`, `timestamp`).

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
  memory:
    maximum: 2147483648  # optional, in bytes; falls back to cgroup v2 → cgroup v1 → OS total memory when unset
    thresholds:           # optional; defaults shown below
      low: 25.0
      medium: 50.0
      high: 75.0
      over: 100.0
    data_store:
      size: 100            # optional; maximum number of memory readings retained in-memory
      interval: 5          # optional; seconds between RSS samples
      page_size: 20        # optional; max entries /memory/history.json returns per request
```

When `enable_shutdown` is `false`, `GET /settings.json` returns 403 and the frontend hides the shutdown button.

When `autostart` is `false`, the application boots with the web server running but the engine `stopped` (no jobs enqueued, no allocation happening) until `PATCH /engine/start` is called. This only takes effect when `web.port` is configured — without a web server there's no way to trigger a manual start.

When `idle_timeout` is set to a positive number of seconds, the application auto-shuts-down (web server included, same as `PATCH /engine/shutdown`) once it has gone that long with no busy workers and no jobs in any queue. The countdown starts as soon as the application goes idle and resets any time a job exists or a worker becomes busy again — it is re-evaluated on every `Engine` loop tick rather than tracked by a separate timer. This applies independently of `enable_shutdown`: disabling the manual shutdown button/endpoint does not disable `idle_timeout`. Leaving `idle_timeout` unset (or `0`) preserves the default behavior — the web server lingers indefinitely.

`web.api.token` is the shared bearer token required by every `/api/*` endpoint (see [`/api` namespace](#api-namespace)). It is loaded the same way every other config value is — including via the env-variable resolver (e.g. `$NAVI_API_TOKEN`). Leaving it unset means every `/api/*` request is rejected with 403, since no provided token can ever match — this is the intended safe default, not a bug.

`web.memory.thresholds` must be in strictly ascending order (`low < medium < high < over`); boot fails fast with `InvalidMemoryThresholds` when this doesn't hold. `web.memory` (like the rest of `web:`) is only ever parsed when `web.port` is set — without a running web server there's no route to serve it from.

`web.memory.data_store.size` (default `100`) configures the retention limit of an in-memory ring buffer of memory readings, mirroring the log buffer's `size`. `web.memory.data_store.interval` (default `5`) is the number of seconds between RSS samples. `web.memory.data_store.page_size` (default `20`, matching `web.logs_page_size`) bounds how many entries `GET /memory/history.json` returns per request. Together, `size` and `interval` determine the retained window: roughly `size × interval` seconds — ~8 minutes at the defaults (`100 × 5s`).

A `MemorySampler`, started by `ServerController` alongside the web server, fills this buffer: it takes one immediate sample on boot, then samples `process.memoryUsage().rss` every `interval` seconds for as long as the web server runs, writing into the process-wide `MemoryRegistry`. The read endpoint, [`GET /memory/history.json`](#get-memoryhistoryjson), serves this buffer over HTTP.

`interval` is validated at config load: a non-finite or `<= 0` value throws `InvalidMemoryDataStore` and boot fails fast (a bad interval would otherwise busy-loop the sampler's timer). `size` and `page_size` are taken raw, unvalidated, matching the sibling `log.size` / `emit.size` / `extraction.size` keys.

`data_store.*` is **boot-time only**: reloading configuration (`PATCH /engine/reload`) re-merges namespace config into the running instance but does not rebuild registries or restart `ServerController`, so a live reload never re-cadences the sampler or resizes the buffer — same as `log.size` / `emit.size`. Changing these values requires a full restart.

### `emit.size`

```yaml
emit:
  size: 100   # optional; retention of the in-memory emission ring buffer
```

`emit.size` (default `100`) is a **top-level** config key — a sibling of `resources`,
`web` and `log`, mirroring how top-level `log.size` relates to per-context logging. It is
**separate from** the per-resource `resources.*.emit` block (which declares where a
crawler sends extracted items): `emit.size` only bounds how many per-emission records
`GET /emissions.json` keeps in memory. The emission counters themselves are unbounded and
stay exact for the whole run; both the ring buffer and the counters reset on engine stop.

### `extraction.size`

```yaml
extraction:
  size: 100   # optional; retention of the in-memory extraction ring buffer
```

`extraction.size` (default `100`) is a **top-level** config key — a sibling of `resources`,
`web`, `log` and `emit`, and it works exactly like `emit.size` but for the per-extraction
store behind `GET /extractions.json`: it only bounds how many per-extraction-run records are
retained. `counts.extracted` is unbounded and stays exact for the whole run; both the ring
buffer and the counter reset on engine stop.
