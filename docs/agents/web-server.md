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
├── extensions/
│   ├── ExtensionsEnv.js            # resolves NAVI_EXTENSIONS_ENABLED / NAVI_EXTENSIONS_DIR / frontendDir
│   ├── ExtensionModuleValidator.js # validates a mounted module's descriptor array
│   └── ExtensionRoutesLoader.js    # scans backend/, imports + registers extra routes
└── handlers/
    ├── AssetsHandler.js
    ├── FrontendAssetsHandler.js     # serves a mounted frontend/*.js|css bundle
    ├── FrontendManifestHandler.js   # GET /extensions/frontend.json discovery manifest
    ├── IndexHandler.js
    ├── JobsFilter.js
    ├── LinksHandler.js
    ├── LogsHandler.js
    ├── MenuHandler.js
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

When `NAVI_EXTENSIONS_ENABLED` is truthy, additional `GET` / `PATCH` / `POST` routes are
loaded from `<NAVI_EXTENSIONS_DIR>/backend/*.js` at boot and registered *after* the stock
routes — stock routes always win on collision. See [Route extensions](#route-extensions).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/settings.json` | Returns `{ "enable_shutdown": true }` when shutdown is enabled; 403 when disabled. |
| `GET` | `/stats.json` | Aggregated worker and job-queue counts, plus crawler `emissions` counters. |
| `GET` | `/emissions.json` | Crawler emission tracking: aggregate counters plus a paginated ring buffer of per-emission records. |
| `GET` | `/extractions.json` | Crawler extraction tracking: `counts.extracted` plus a paginated ring buffer of per-extraction records. |
| `GET` | `/links.json` | Configured `web.links` plus one link per client (`base_url` and `linkText`/client name). |
| `GET` | `/menu.json` | Internal navigation menu entries from the menu config file (`{ route, text }` list) plus an always-present `hidden` array of non-default routes flagged `hidden: true`; defaults to Logs + Memory. |
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
| `GET` | `/extensions/frontend.json` | Discovery manifest for mounted frontend extension bundles; `{ "bundles": [] }` when extensions are disabled or no `frontend/` folder is mounted (never 404). |
| `GET` | `/extensions/frontend/*path` | Serves a mounted frontend bundle (`*.js`) or stylesheet (`*.css`) straight from `<NAVI_EXTENSIONS_DIR>/frontend/`; 403 on path-traversal, 404 when the feature is disabled or the file is missing. |
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

### `GET /menu.json`

Returns the internal navigation menu, loaded from the menu config file (see
[Configuration](#configuration)):

```json
{
  "entries": [
    { "route": "/logs", "text": "Logs" },
    { "route": "/memory/status", "text": "Memory" }
  ],
  "hidden": []
}
```

`entries` is always present and is emitted in file (render) order. Each entry has
exactly `route` (a non-empty, whitespace-free string that either starts with `/`
or matches `^https?://`) and `text` (the server always populates it, defaulting
to `route` when the file omits it, mirroring how `Link` defaults `text` to
`url`). `hidden` is accepted and type-checked in the file but is never serialized
as an entry.

`hidden` is an always-present array (empty when unused) of the non-default
`route` strings that carried `hidden: true` in the menu file. `hidden: true` on a
shipped-default route still just suppresses that default (it is *not* listed
here); on any other route the route is now retained and reported in this array so
the SPA can drop the matching auto-appended frontend-extension menu entry.

An absent, empty, or whitespace-only menu file — or a document with no `entries`
key — yields the two defaults above (`/logs` "Logs", `/memory/status` "Memory")
from an in-code fallback constant. An explicit `entries: []` yields
`{ "entries": [] }`. Malformed individual entries are dropped server-side with a
`Logger.warn` and never reach the response. A file-level parse failure (invalid
YAML, or an `entries` value that is present but not a list) is fail-fast: startup
aborts with `MenuConfigurationInvalid`, matching the `ConfigIncluder` posture on
a broken main config.

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

## Route extensions

An operator can mount a folder of extra route handlers that Navi loads and registers at
boot, without forking. The mechanism is off by default and has **no YAML key and no
`WebConfig` field** — it is driven entirely by two environment variables, read straight
from `process.env` through `ExtensionsEnv`:

- **`NAVI_EXTENSIONS_ENABLED`** — enabled only when the trimmed, lower-cased value is one
  of `1`, `true`, `yes`, `on`. Anything else (including unset) leaves the feature off.
- **`NAVI_EXTENSIONS_DIR`** — absolute path to the mount, default `/navi/extensions`.

### Mounted layout

Backend handlers live in `<NAVI_EXTENSIONS_DIR>/backend/*.js`, a **flat, non-recursive**
listing (nested directories are ignored, not an error), loaded in lexicographic filename
order. A non-`.js` sibling is ignored silently.

### Module contract

Each file default-exports (or exports as `routes`) an array of descriptors:

```js
import { RequestHandler } from 'navi-hey/extension';

class HealthHandler extends RequestHandler {
  constructor(req, res) { super(); this.res = res; }
  handle() { this.res.json({ status: 'ok' }); }
}

export default [
  { method: 'GET', path: '/ext/health', handler: HealthHandler },
];
```

- `method` — `GET`, `PATCH` or `POST` (case-insensitive).
- `path` — a non-empty, `/`-prefixed, whitespace-free string.
- `handler` — a `RequestHandler` subclass, imported as
  `import { RequestHandler } from 'navi-hey/extension'`. It is instantiated
  `new handler(req, res)` per request and its `handle()` is invoked with the same
  `RouteRegister` guarantees as stock handlers (`ForbiddenError` → 403,
  `NotFoundError` → 404, anything else → 500). Extension routes are **public** — there is
  no token wiring in v1.

### Error handling

A module that fails to import, does not export a descriptor array, or contains an invalid
descriptor is **skipped with a `Logger.warn`** — the server still comes up with the stock
routes and every other valid extension. The one fatal case: when the feature is enabled
but `NAVI_EXTENSIONS_DIR` is unset / missing / not a directory, boot **fails fast** with
`ExtensionsDirectoryMissing`, matching the `MenuConfigurationInvalid` posture.

### Collisions

A descriptor whose `"<METHOD> <path>"` key matches a built-in Navi route is dropped with a
warning ("path is a built-in Navi route"); stock always wins. When two extension files
declare the same key, the lexicographically-first file wins and the later one is dropped
with a warning naming the winner. Collisions are never fatal. After the scan, one audit
line is emitted:

```
[extensions] loaded 2 backend route(s): GET /ext/health (a_health.js), POST /ext/reindex (b_reindex.js)
```

### Security posture

The opt-in flag is the only control. Extension code is **operator-owned and runs
in-process — it is not sandboxed**. `PathValidator` only prevents the `backend/` scan from
following a symlink out of the mounted folder; it does not constrain what a loaded module
can do.

### Lifetime

Extensions are scanned exactly once, at boot. `PATCH /engine/reload` does **not** re-scan —
the route set is fixed for the process lifetime, so picking up added/changed/removed
extension files requires a container restart.

### Compose example

```yaml
services:
  navi_app:
    environment:
      NAVI_EXTENSIONS_ENABLED: "true"
    volumes:
      - ./my-extensions:/navi/extensions
```

### Frontend extensions

The same mount also carries pre-built SPA bundles under
`<NAVI_EXTENSIONS_DIR>/frontend/` — a **flat, non-recursive** listing of ESM
`*.js` files, each optionally paired with a sibling `*.css` of the same basename.
Unlike backend routes there is **no boot-time scan and no code executes in the
Navi process**: the server only enumerates and streams files.

- **`GET /extensions/frontend.json`** enumerates `frontend/*.js` (lexicographic,
  non-`.js` siblings ignored) into `{ "bundles": [ { "src": "/extensions/frontend/<name>.js", "css": "/extensions/frontend/<name>.css" } ] }`
  — `css` only present when the sibling stylesheet exists. Returns
  `{ "bundles": [] }` (never 404) when `NAVI_EXTENSIONS_ENABLED` is off or no
  `frontend/` folder is mounted.
- **`GET /extensions/frontend/*path`** streams one bundle / stylesheet from
  `ExtensionsEnv.frontendDir`, `PathValidator`-guarded (403 on traversal),
  404 when the feature is disabled or the file is missing.

Both handlers read `ExtensionsEnv` per request (no caching, no
`ApplicationInstance` threading) and are registered in `Router.build()` right
after the stock `GET` map and before `express.static`, so `/extensions/*` never
falls through to the SPA catch-all. The SPA — not the server — fetches the
manifest, injects each bundle, and reconciles the resulting menu entries against
`/menu.json`'s `hidden` array. See `docs/agents/frontend.md` for the SPA-side
wiring.

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
**`MenuSerializer`** flattens `MenuEntry` instances (`route`, `text`) for the `entries` array
of `GET /menu.json`.

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

### Menu configuration (`-m` / `--menu`)

The internal navigation menu served by [`GET /menu.json`](#get-menujson) is
driven by a dedicated file, separate from the main config and **not** part of the
`Config` model. `bin/navi.js` accepts `-m <path>` / `--menu=<path>` (mirroring
`-c` / `--config` in every respect, including "flag supplied without a value
throws"), defaulting to `config/menu.yml` (exported as `DEFAULT_MENU_FILE` from
`ArgumentsParser`). The production Docker image sets `ENV NAVI_MENU=./config/menu.yml`
and invokes `navi-hey -c $NAVI_CONFIG -m $NAVI_MENU`.

```yaml
# Top-level sibling of `entries`. `defaults: false` drops both shipped
# defaults; omit it (or set `true`) to keep them.
defaults: true
entries:
  - route: /dashboard
    text: Dashboard
  - route: https://status.example.com
    text: Status page
```

`${VAR}` / `$VAR` interpolation works inside the file (same `EnvStringResolver`
used for the main config). The file is parsed once at startup
(`MenuConfig.fromFile`) and the resulting `MenuEntry[]` is threaded to `Router`
as a plain value alongside `webConfig`. A missing or blank file — or one that is
fully commented out (the shipped `config/menu.yml` is exactly that) — falls back
to the built-in Logs + Memory menu, so a deployment that deletes the shipped
`config/menu.yml` still gets a working menu.

`MenuConfig` resolves the whole render list at load time; `GET /menu.json` only
ever sees the final, ordered result. The operator levers:

- **Merge with defaults.** Operator `entries` are appended *after* the shipped
  Logs + Memory defaults: defaults first (shipped order), then custom entries in
  file order.
- **`defaults: false`.** A top-level boolean sibling of `entries`. `false` drops
  **both** shipped defaults, so only operator entries render — this is the only
  way to reach an empty menu. A non-boolean value is ignored with a
  `Logger.warn` and treated as `true`.
- **`entries: []`.** With `defaults` absent or `true`, an explicit empty list
  still renders Logs + Memory (an empty custom list, not a wipe). This reverses
  the earlier behaviour where `entries: []` produced an empty menu.
- **`hidden: true`.** On an entry whose `route` matches a shipped default
  (`/logs`, `/memory/status`) it removes just that default; the `hidden` entry
  itself never renders and is not listed anywhere. On any other `route` the entry
  still never renders in `entries`, but its `route` is collected (file order,
  de-duplicated) into `GET /menu.json`'s `hidden` array for the SPA to filter
  frontend-extension routes against.
- **Repositioning a default.** A non-hidden custom entry whose `route` matches a
  shipped default pulls that default out of the default block and renders it at
  the custom entry's file position — never duplicated. A supplied `text`
  overrides the default label; an omitted `text` keeps the shipped label
  (`Logs` / `Memory`), not the route.
- **First-wins de-duplication by `route`.** Evaluated over the merged
  render-order list: the first occurrence of a `route` wins and every later
  entry with the same `route` is dropped with a `Logger.warn` whose indices
  count positions in the merged list. Reusing a default's *text* on a different
  `route` is allowed and silent — only `route` is an identity.

Individual malformed entries are dropped with a `Logger.warn` (keyed by their raw
`entries` index). Unparseable YAML, or an `entries` value that is present but not
a list, still fails fast at startup with `MenuConfigurationInvalid`.

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
