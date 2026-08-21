# Source Layout

## Repository Layout

```
navi/
├── source/           # Navi cache-warmer Node.js application
├── frontend/         # Navi web UI (React + Vite)
├── worker/           # deku-swarm: generic queue-and-pool worker package, consumed by source/
├── clients/
│   └── node/         # navi-hey-client: Node.js client for Navi's /api/* namespace
├── dev/
│   ├── app/          # Dev backend: Express JSON API
│   ├── frontend/     # Dev frontend: React SPA for browsing the dev API
│   └── proxy/        # Dev reverse proxy: Tent configuration + static assets
├── dockerfiles/      # Dockerfiles for each service image
├── scripts/          # Shell utilities (CI, release, etc.)
└── docs/             # Project documentation
```

## Source Code Layout

All application source code lives under the `source/` directory.
The main library is organized into subdirectories under `source/lib/`:

### `exceptions/`

Custom error classes following a strict inheritance hierarchy.
All exceptions extend `AppError`, which automatically sets `error.name` from the subclass constructor name.

```
AppError (base — exceptions/)
├── ItemNotFound (registry/)
│   ├── ClientNotFound (registry/)
│   └── ResourceNotFound (registry/)
├── MissingTopLevelConfigKey (config/)
│   ├── MissingClientsConfig (config/)
│   └── MissingResourceConfig (config/)
├── RequestFailed (request/)
├── InvalidResponseBody (request/)
├── InvalidHtmlResponseBody (request/)
├── NullResponse (request/)
├── MissingActionResource (registry/)
├── MissingMappingVariable (registry/)
├── ConfigurationFileNotFound (config/)
├── ConfigurationFileNotProvided (config/)
├── ConflictError (http/)
├── ForbiddenError (http/)
└── NotFoundError (http/)
```

Subfolders:

- `exceptions/` — `AppError` (shared base class, stays at root)
- `exceptions/http/` — HTTP/server errors: `ConflictError`, `ForbiddenError`, `NotFoundError`
- `exceptions/config/` — Config errors: `ConfigurationFileNotFound`, `ConfigurationFileNotProvided`, `MissingClientsConfig`, `MissingResourceConfig`, `MissingTopLevelConfgKey`
- `exceptions/request/` — Network/response errors: `InvalidHtmlResponseBody`, `InvalidResponseBody`, `NullResponse`, `RequestFailed`
- `exceptions/registry/` — Registry/lookup errors: `ClientNotFound`, `ItemNotFound`, `MissingActionResource`, `MissingMappingVariable`, `ResourceNotFound`

All custom exceptions must extend `AppError` (directly or via an intermediate class); never extend `Error` directly.

### `models/`

Data containers mapping YAML config to typed instances. Most expose `fromObject()` / `fromListObject()` static factory methods. Key classes:

- **`Config`** — top-level container (`ResourceRegistry`, `ClientRegistry`, `WorkersConfig`, `WebConfig`); entry point via `Config.fromFile(filePath)`.
- **`ResourceRequest`** — a single URL template + expected status + optional actions, paginated actions, and assets. Exposes `resolveUrl(parameters)`, `enqueueActions()`, `enqueuePaginatedActions()`, `enqueueAssets()`.
- **`ResourceRequestAction`** / **`ResourceRequestPaginatedAction`** — response chaining: map response fields to parameters and enqueue follow-up `ResourceRequestJob`s.
- **`ResponseWrapper`** / **`ParametersMapper`** / **`PathResolver`** — path expression evaluation (`parsedBody.field`, `headers['key']`) against HTTP responses.
- Sub-models: `WorkersConfig`, `WebConfig`, `PaginationConfig`, `AssetRequest`.

Subfolders:

- `models/configs/` — configuration models: `Config`, `FailureConfig`, `LogConfig`, `PaginationConfig`, `WebConfig`, `WorkersConfig`
- `models/request/` — request models: `AssetRequest`, `Resource`, `ResourceRequest`, `ResourceRequestAction`, `ResourceRequestPaginatedAction`
- `models/response/` — response-parsing models: `ParametersMapper`, `PathResolver`, `PathSegmentTraverser`, `ResponseParser`, `ResponseWrapper`

`Job`/`Worker`, the registries (`JobRegistry`/`WorkersRegistry`), their factories, `Engine`, `WorkersAllocator`, the collection primitives, and the generic `Factory`/`IdGenerator` utilities all live in the separate `worker/` package (`deku-swarm`), not under `source/lib/`. See [Worker Subsystem](../worker.md) for their class-by-class reference; `source/` only consumes them via `import { ... } from 'deku-swarm'`.

### `enqueuers/`

Push jobs into `JobRegistry`:

- **`ActionsEnqueuer`** — one `ActionProcessingJob` per `(item × action)` pair.
- **`PaginatedActionsEnqueuer`** — one `PaginatedActionProcessingJob` per paginated action.
- **`AssetRequestEnqueuer`** — one `AssetDownloadJob` per discovered asset URL.

`ActionEnqueuer` and `PaginatedActionEnqueuer` are per-action delegates used internally.

### `jobs/`

Concrete `Job` subclasses:

- **`ResourceRequestJob`** — performs the HTTP request; enqueues action and asset jobs from the response. Standard retry/dead path.
- **`ActionProcessingJob`** — executes one `(action, item)` pair; no retry rights.
- **`PaginatedActionProcessingJob`** — evaluates page count, enqueues per-page `ResourceRequestJob`s; no retry rights.
- **`HtmlParseJob`** — parses HTML to extract asset URLs; no retry rights.
- **`AssetDownloadJob`** — fetches one resolved asset URL; leaf node with standard retry/dead path.

### `registry/`

`NamedRegistry` base class for named-lookup collections; `ResourceRegistry` and `ClientRegistry` extend it (throwing `ResourceNotFound` / `ClientNotFound` on miss). `LogRegistry` is a standalone singleton façade that fans out log calls to a `ConsoleLogger` and a `BufferedLogger`, and exposes filtered log query methods.

### `utils/`

Shared low-level utilities with no domain knowledge:

- **`common/utils/`** — shared utilities consumed by both `source/` and `dev/app/`: `EnvResolver`, `env_resolver/EnvStringResolver`, `logging/*`.
- **`common/server/`** — shared server base classes consumed by both `source/` and `dev/app/`: `RequestHandler` (abstract base).
- **`utils/logging/`** — compatibility re-exports to `common/utils/logging/*`, plus `LogContext` (Navi-specific logging, wired into `deku-swarm`'s `Worker` via an injected `loggerFactory`).
- **`utils/generators/`** — `IncrementalIdGenerator` (`IdGenerator`/`UUidGenerator` moved to `worker/lib/generators/`, part of `deku-swarm`).
- **`utils/`** (flat) — `HtmlParser` (CSS selector extraction from HTML), `ResourceRequestCollector` (finds parameter-free requests for initial enqueueing), `ResourceEnqueuer` (calls `deku-swarm`'s `JobRegistry.enqueue()` from outside the package).

### `services/`

Business logic and I/O layer:

- **`Application`** — static singleton façade; `loadConfig()` bootstraps registries and factories; `run()` starts engine and web server concurrently. Lifecycle methods (`pause`, `stop`, `continue`, `start`, `restart`) delegate to `ApplicationInstance`.
- **`ApplicationInstance`** — orchestrates boot: registers job factories, builds `JobRegistry`/`WorkersRegistry`/`Engine` (all from `deku-swarm`, see [Worker Subsystem](../worker.md)), wires Navi's `LogContext` in as `Worker`'s `loggerFactory`.
- **`Client`** — Axios-based HTTP executor; `perform()` for URL-template requests, `performUrl()` for absolute URLs; supports per-client headers with env var interpolation.
- **`ConfigLoader`** / **`ConfigParser`** / **`ArgumentsParser`** — config file I/O and CLI argument parsing.
- `Engine`, `WorkersAllocator`, and the generic `Factory` object-builder are no longer under `source/lib/services/`/`source/lib/factory/` — they moved to `worker/` (`deku-swarm`); see [Worker Subsystem](../worker.md).

### `serializers/`

Plain-object views of domain models, used by the web server's JSON responses:

- **`Serializer`** — abstract base; static `serialize(itemOrList, options)` maps over arrays and delegates single items to `_serializeObject`, which subclasses must override.
- **`LinksSerializer`**, **`LogSerializer`**, **`JobSerializer`**, **`JobIndexSerializer`**, **`JobShowSerializer`** — concrete serializers for their respective domain objects.

### `server/`

Express-based web server. `Router` wires all request handler executors and serves the React SPA from `source/static/`. Routes are declared as a config map of path → `HandlerConfig` instance; `HandlerConfig` holds the executor class and any extra constructor parameters, then lazily constructs the executor with `(req, res, ...parameters)` on each request. The shared `RequestHandler` base remains under `common/server/` for `dev/app`, while `source/` routes register executors directly via `RouteRegister`, which maps domain errors to HTTP status codes (403/404/500). See [Web Server](../web-server.md) for the full route reference.

Subfolders:

- `server/` — routing infrastructure: `WebServer`, `Router`, `RouteRegister`, `HandlerConfig`, `PathValidator`
- `server/handlers/` — general executors and helpers: `AssetsHandler`, `IndexHandler`, `JobsFilter`, `LinksHandler`, `LogsHandler`, `SettingsHandler`, `StatsHandler`
- `server/handlers/engine/` — engine lifecycle executors: `EngineContinueHandler`, `EnginePauseHandler`, `EngineRestartHandler`, `EngineShutdownHandler`, `EngineStartHandler`, `EngineStatusHandler`, `EngineStopHandler`
- `server/handlers/jobs/` — job executors: `JobLogsHandler`, `JobHandler`, `JobRetryHandler`, `JobsHandler`
