# Architecture

## Repository Layout

```
navi/
├── source/           # Navi cache-warmer Node.js application
├── frontend/         # Navi web UI (React + Vite)
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
The main library is organized into four subdirectories under `source/lib/`:

### `exceptions/`

Custom error classes following a strict inheritance hierarchy.
All exceptions extend `AppError`, which automatically sets `error.name` from the subclass constructor name.

```
AppError (base)
├── ItemNotFound
│   ├── ClientNotFound
│   └── ResourceNotFound
├── MissingTopLevelConfigKey
│   ├── MissingClientsConfig
│   └── MissingResourceConfig
├── RequestFailed
├── LockedByOtherWorker
├── InvalidResponseBody          ← raw JSON response body could not be parsed
├── InvalidHtmlResponseBody      ← raw HTML response body could not be parsed
├── NullResponse                 ← parsed response body is null
├── MissingActionResource        ← action config entry has no "resource" field
├── MissingMappingVariable       ← parameters path expression cannot be resolved against the response
├── ConfigurationFileNotFound    ← YAML config file does not exist at the given path
└── ConfigurationFileNotProvided ← no config file path was supplied to Application
```

All custom exceptions must extend `AppError` (directly or via an intermediate class); never extend `Error` directly.

### `models/`

Data containers that map YAML configuration to typed instances.
Most models expose static factory methods (`fromObject()`, `fromListObject()`) for creation from parsed YAML.

| Class | Responsibility |
|-------|---------------|
| `Config` | Top-level container holding `ResourceRegistry`, `ClientRegistry`, `WorkersConfig`, and `WebConfig`. Entry point: `Config.fromFile(filePath)`. |
| `Resource` | Named collection of `ResourceRequest` objects, representing a server resource. |
| `ResourceRequest` | A single URL + expected HTTP status code + optional client name + optional actions list + optional assets list. Exposes `resolveUrl(parameters)` to substitute `{:placeholder}` tokens with runtime values. Exposes `enqueueActions(responseWrapper)` to enqueue action jobs after a successful HTTP request. Exposes `enqueueAssets(rawHtml, jobRegistry, clientRegistry)` to enqueue an `HtmlParseJob` when assets are configured. Exposes `hasAssets()` to check whether any asset extraction rules are configured. |
| `AssetRequest` | Represents a single asset extraction rule (`selector`, `attribute`, optional `client`, optional `status`). Created via `AssetRequest.fromObject()` / `AssetRequest.fromListObject()`. |
| `ResourceRequestAction` | Represents a single action entry from the config (`resource` + optional `parameters`). Uses `ParametersMapper` to evaluate path expressions against a `ResponseWrapper`, looks up the target resource via `ResourceRegistry`, and enqueues one `ResourceRequestJob` per `ResourceRequest` in that resource with the mapped variables as job parameters. |
| `ResponseParser` | Parses a raw JSON string into a JS value. Throws `InvalidResponseBody` if the string cannot be parsed. |
| `ResponseWrapper` | Wraps an HTTP response, exposing `parsedBody` (lazily-parsed JSON body) and `headers`. Provides `toItemWrappers()` to split an array response into per-item wrappers sharing the same headers. |
| `ActionsEnqueuer` | Receives a list of per-item `ResponseWrapper` instances and enqueues one `ActionProcessingJob` per `(item × action)` pair. Throws `NullResponse` for null items list. Delegates per-action enqueueing to `ActionEnqueuer`. |
| `ActionEnqueuer` | Enqueues one `ActionProcessingJob` per item for a single `ResourceRequestAction`. Calls `JobRegistry.enqueue('Action', { action, item })` for each item. |
| `ActionsExecutor` | (Legacy — kept for reference.) Receives per-item wrappers and dispatches each `ResourceRequestAction` per item synchronously. No longer called by `ResourceRequestJob`; removal is a follow-up. |
| `ParametersMapper` | Applies a `parameters` map to a response wrapper, delegating each path expression (e.g. `parsedBody.id`, `headers['page']`) to a `PathResolver` to extract values. When no map is provided, the item passes through unchanged. |
| `PathResolver` | Resolves a single dot/bracket-notation path expression against an object. Created via `PathResolver.fromExpression(pathExpr)`. Delegates segment-by-segment traversal to `PathSegmentTraverser`. |
| `PathSegmentTraverser` | Traverses an object one path segment at a time. Provides semantic methods (`traverse`, `value`) and throws `MissingMappingVariable` when a segment cannot be resolved (non-object value or missing key). |
| `Worker` | Represents a worker; holds its UUID, `jobRegistry`, and `workersRegistry` references. |
| `Job` | Abstract base class for all units of work. Tracks a failure counter (accessible as `_attempts` by subclasses) and last exception. |
| `ResourceRequestJob` | Extends `Job`. Performs an HTTP request for a `ResourceRequest`, wraps the response in a `ResponseWrapper`, then calls `resourceRequest.enqueueActions(wrapper)` to enqueue action jobs. Receives a `jobRegistry` at build time. |
| `ActionProcessingJob` | Extends `Job`. Processes a single `(action, item)` pair by calling `action.execute(item)` where `item` is a per-item `ResponseWrapper`. Exhausted after the first failure — no retry rights. |
| `HtmlParseJob` | Extends `Job`. Parses an HTML response body using `HtmlParser`, resolves asset URLs, and enqueues one `AssetDownloadJob` per discovered URL. Exhausted after the first failure — no retry rights. |
| `AssetDownloadJob` | Extends `Job`. Fetches a single fully-resolved asset URL via `Client.performUrl()` and validates the expected HTTP status. Leaf node — no further chaining. Follows the standard retry/dead path. |
| `WorkersConfig` | Holds the worker pool size (`quantity`, default 1), the retry cooldown in milliseconds (`retryCooldown`, default 2000), and the engine sleep interval in milliseconds (`sleep`, default 500). |
| `WebConfig` | Holds the web UI configuration (`port`). Parsed from the optional `web:` top-level key; `null` when the key is absent, which disables the web server. |

### `registry/`

Collection managers built on a shared base class.

- **`NamedRegistry`** — Base class providing a generic `getItem(name)` lookup that throws the subclass-defined `notFoundException` when an item is missing.
- **`ResourceRegistry`** — Extends `NamedRegistry`; throws `ResourceNotFound`.
- **`ClientRegistry`** — Extends `NamedRegistry`; throws `ClientNotFound`. Adds smart default-client resolution via `getClient([name])`.
- **`JobRegistry`** — Static singleton facade for the job queues. Call `JobRegistry.build(options)` once during bootstrap; call `JobRegistry.reset()` in tests. Delegates all operations to a `JobRegistryInstance`. Key static methods: `enqueue(factoryKey, params)`, `fail(job)`, `finish(job)`, `pick()`, `hasJob()`, `hasReadyJob()`, `promoteReadyJobs()`, `stats()`, `jobsByStatus(status)`, `jobById(id)`.
- **`JobRegistryInstance`** — Holds the actual queues: `enqueued` (FIFO), `processing` (`IdentifyableCollection`), `failed` (`SortedCollection` sorted by `readyBy` timestamp), `retryQueue` (FIFO), `finished`, and `dead`. `promoteReadyJobs()` moves cooled-down failed jobs to `retryQueue`. `jobsByStatus(status)` returns job data from the named collection. `jobById(id)` searches all collections and returns the job data or `null`. Not exported; accessed only via `JobRegistry`.
- **`WorkersRegistry`** — Static singleton facade for the worker pool. Call `WorkersRegistry.build(options)` once during bootstrap; call `WorkersRegistry.reset()` in tests. Delegates to a `WorkersRegistryInstance`. Key static methods: `initWorkers()`, `setBusy(id)`, `setIdle(id)`, `hasBusyWorker()`, `hasIdleWorker()`, `getIdleWorker()`, `stats()`.
- **`WorkersRegistryInstance`** — Holds the actual worker collections: `workers` (all), `idle`, `busy`. `getIdleWorker()` atomically moves a worker from idle to busy and returns it. Not exported; accessed only via `WorkersRegistry`.

Follow the Registry pattern: add new collection managers as subclasses of `NamedRegistry`, overriding only the `notFoundException` static property.

### `utils/`

Shared low-level utilities with no domain knowledge. Organized into three subfolders:

#### `utils/logging/`

The logging subsystem. All loggers extend `BaseLogger`, which controls which log levels are
forwarded to `_output`.

| Class | Responsibility |
|-------|---------------|
| `BaseLogger` | Abstract base; applies level filtering and suppression before calling `_output`. |
| `ConsoleLogger` | Extends `BaseLogger`; writes to `console.warn` / `console.error`. |
| `BufferedLogger` | Extends `BaseLogger`; stores log entries in a `LogBuffer` instead of printing. |
| `Logger` | Singleton-style facade that delegates to a `ConsoleLogger` and an optional `LoggerGroup`. |
| `LoggerGroup` | Manages a set of loggers and fans out log calls to all of them. |
| `LogFactory` | Builds `Log` instances with auto-assigned incremental IDs. |
| `Log` | Immutable log entry: `id`, `level`, `message`. |
| `LogBuffer` | Fixed-capacity ring buffer of `Log` entries; used by `BufferedLogger`. |

#### `utils/collections/`

Generic data-structure building blocks used by registries and the engine.

| Class | Responsibility |
|-------|---------------|
| `Collection` | Base array wrapper with `push`, `size`, `hasAny`, `hasItem`. |
| `IdentifyableCollection` | Extends `Collection`; supports `get(id)`, `remove(id)`, `byIndex(n)` keyed by `item.id`. |
| `Queue` | FIFO queue built on `Collection`; adds `pick()` to dequeue from the front. |
| `SortedCollection` | Deferred-sort collection; merges new items with an already-sorted array on `list()`. Exposes range filters: `select`, `after`, `from`, `before`, `upTo`. |
| `SortedArrayMerger` | Merges two sorted arrays in O(n+m). Used by `SortedCollection`. |
| `SortedArraySearcher` | Binary-search helpers on a sorted array. Used by `SortedCollection`. |

#### `utils/generators/`

ID generation utilities.

| Class | Responsibility |
|-------|---------------|
| `IdGenerator` | Abstract base; delegates to `UUidGenerator` by default. |
| `UUidGenerator` | Generates RFC-4122 UUIDs via Node's `crypto.randomUUID()`. |
| `IncrementalIdGenerator` | Generates sequential integer IDs starting from 1. Used by `LogFactory`. |

#### `utils/` (flat)

| Class | Responsibility |
|-------|---------------|
| `EnvResolver` | Resolves environment variable references (`$VAR` / `${VAR}`) in string values. Used by `Client.fromObject()` to interpolate header values at parse time. |
| `HtmlParser` | Parses a raw HTML string using `node-html-parser` and extracts attribute values from elements matched by a CSS selector. Logs warnings for unmatched selectors or elements missing the target attribute. Throws `InvalidHtmlResponseBody` when parsing fails. |
| `ResourceRequestCollector` | Iterates a `ResourceRegistry` and enqueues one job per resource+parameter combination. |

### `services/`

Business logic and I/O layer.

| Class | Responsibility |
|-------|---------------|
| `Application` | Main orchestrator. `loadConfig(configPath)` builds `Config`, registers factories, and initialises `JobRegistry` and `WorkersRegistry` singletons. `run()` creates the engine and optional web server, enqueues initial jobs, then starts both. |
| `ArgumentsParser` | Parses CLI arguments using Node's `parseArgs`. Supports `--config <path>` / `-c <path>`; defaults to `config/navi_config.yml`. Returns `{ config }`. |
| `ConfigLoader` | File I/O — reads YAML from disk using `fs.readFileSync` and the `yaml` library. |
| `ConfigParser` | Converts the parsed YAML object into model instances (validates required keys, builds registries). |
| `Client` | HTTP executor using Axios. `perform(resourceRequest, params)` fetches a URL with `responseType: 'text'` and throws `RequestFailed` if the status does not match. `performUrl(absoluteUrl, expectedStatus)` fetches a fully-resolved absolute URL directly (no `baseUrl` prepended). Supports per-client headers (including environment variable interpolation via `$VAR` / `${VAR}` syntax, resolved at parse time). |
| `Engine` | Drives the main allocation loop. Each tick calls `JobRegistry.promoteReadyJobs()` then delegates to `WorkersAllocator.allocate()` while jobs or busy workers exist. Sleeps for `sleepMs` (default 500 ms) when all pending jobs are in cooldown. |
| `WorkersAllocator` | Assigns ready jobs to idle workers. On each `allocate()` call, repeatedly pairs `WorkersRegistry.getIdleWorker()` with `JobRegistry.pick()` until either pool is exhausted. |
| `JobFactory` | Static registry of named job factories. `JobFactory.build(name, options)` registers a factory; `JobFactory.get(name)` retrieves it; `JobFactory.reset()` clears all entries (test teardown). |

### `server/`

Express-based web server and request handlers.

| Class | Responsibility |
|-------|---------------|
| `WebServer` | Optional Express.js server. `WebServer.build({ webConfig })` returns `null` when `webConfig` is absent; otherwise creates an instance listening on `webConfig.port`. Serves the React SPA from `source/public/`. |
| `Router` | Builds the Express `Router`: registers `GET /stats.json`, `GET /jobs/:status.json`, and `GET /job/:id.json` via `RouteRegister`, serves static files from `source/public/`, and falls back to `index.html` for SPA navigation. |
| `RouteRegister` | Helper that wires a route path to a `RequestHandler` instance on an Express router. |
| `RequestHandler` | Abstract base class for route handlers. Subclasses implement `handle(req, res)`. |
| `StatsRequestHandler` | Extends `RequestHandler`. Responds to `GET /stats.json` with `{ jobs: JobRegistry.stats(), workers: WorkersRegistry.stats() }`. |
| `JobsRequestHandler` | Extends `RequestHandler`. Responds to `GET /jobs/:status.json` with the array of jobs in the given status queue (from `JobRegistry.jobsByStatus(status)`). |
| `JobRequestHandler` | Extends `RequestHandler`. Responds to `GET /job/:id.json` with job details from `JobRegistry.jobById(id)`, or 404 if not found. |

### `factories/`

| Class | Responsibility |
|-------|---------------|
| `Factory` | Base factory class. Generates instances via `build(params)`, merging static `attributes` with an `attributesGenerator` result and caller-supplied params. |
| `JobFactory` | Static facade (see `services/` above). |
| `WorkerFactory` | Extends `Factory`. Creates `Worker` instances with unique IDs via `IdGenerator`. Used by `WorkersRegistryInstance.initWorkers()`. |

## Test Layout

All specs live under `source/spec/`:

```
source/spec/
  lib/                  ← mirrors source/lib/ exactly
    exceptions/
    factories/
    models/
    registry/
    server/
    services/
    utils/
      logging/          ← specs for utils/logging/
      collections/      ← specs for utils/collections/
      generators/       ← specs for utils/generators/
      ResourceRequestCollector_spec.js
  support/              ← shared test helpers (factories, dummies, fixtures)
    dummies/
    factories/
    utils/
```

The naming convention for spec files is `<ClassName>_spec.js`, placed in the subfolder that
mirrors the source file's location under `source/lib/`. For example:
- `source/lib/models/Job.js` → `source/spec/lib/models/Job_spec.js`
- `source/lib/utils/logging/Logger.js` → `source/spec/lib/utils/logging/Logger_spec.js`

Support files (factories, dummies, fixtures) live under `source/spec/support/` and are never
discovered by the test runner as specs.

## Module System

The project uses **ES Modules** (`"type": "module"` in `package.json`).

- Use `import`/`export` syntax exclusively; CommonJS (`require`/`module.exports`) is not used.
- Always include the `.js` extension in import paths (e.g., `import Foo from './Foo.js'`).
- In test files, use `import.meta.url` for ESM-compatible path resolution when loading fixtures.

## Package Manager

Use **Yarn** for installing and managing dependencies. Do not use `npm install`.

## Code Style

Enforced via ESLint (`source/eslint.config.mjs`):

- **Indentation:** 2 spaces (no tabs).
- **Quotes:** Single quotes; double quotes only when the string itself contains a single quote.
- **Semicolons:** Required at end of statements.
- **Variable declarations:** `const` by default; `let` when reassignment is needed; `var` is forbidden.
- **Equality:** Always use strict equality (`===`).
- **Unused variables:** Not allowed; parameters prefixed with `_` are exempt.
- **`console`:** Only `console.warn` and `console.error` are permitted.
- **Import order:** Imports must be alphabetized and grouped (`builtin → external → internal → local`).
- **Complexity limits:** Max cyclomatic complexity 10, max file length 300 lines, max nesting depth 4.

## Quality and Tooling

- Unit tests must use **Jasmine** (`spec/lib/**/*_spec.js` naming convention).
- Code coverage must use **c8** (`yarn test` runs `c8 jasmine spec/**/*.js`, which recursively covers `spec/lib/`).
- Linting must use **ESLint** (`yarn lint`).
- Copy/paste and duplication analysis must use **JSCPD** (`yarn report`).
- API documentation must be generated with **JSDoc** (`yarn docs`; config: `source/jsdoc.json`).
- CI test execution must run on **CircleCI**.
- Code quality gates should integrate with tools such as **Codacy**.

## Developer Workflow

Development workflow is Docker-based.

### Makefile Commands

| Command | Description |
|---------|-------------|
| `make setup` | Copies `.env.sample` to `.env`; builds `base_build` service; installs Node dependencies via `yarn install`. |
| `make dev` | Runs the `navi_app` container with `/bin/bash`; allows interactive `yarn test`, `yarn lint`, etc. |
| `make tests` | Runs the `navi_tests` container with `/bin/bash` for an isolated test environment. |
| `make build-dev` | Builds the development Docker image tagged `navi:dev` from `dockerfiles/dev_navi_hey/Dockerfile`. |
| `make build` | Builds the production Docker image tagged `darthjee/navi-hey:latest` from `dockerfiles/production_navi_hey/Dockerfile`. |

### Directory Conventions

- Application source code must live in a folder named `source`.
- The `source` folder is mounted as a volume in `docker-compose.yml` for live development.
- Dockerfiles are stored under `dockerfiles/`:
  - Development image: `dockerfiles/dev_navi_hey/Dockerfile`
  - Production image: `dockerfiles/production_navi_hey/Dockerfile`
- `docker_volumes/` is used for development/runtime mounted data:
  - `docker_volumes/config/` — YAML configuration files (never inside `source/`).
  - `docker_volumes/node_modules/` — Node modules cache mounted into the container.

## Implementation Guidelines for Copilot

When generating or modifying code:

1. Prefer queue-driven designs over hardcoded sequential request flows.
2. Keep resource resolution configurable via YAML instead of hardcoding domains, headers, or URLs.
3. Treat resource chaining as a first-class concern.
4. Keep worker logic deterministic and testable.
5. Prioritize CI-oriented execution paths while avoiding assumptions that block future frontend integration.
6. Add or update JSDoc documentation when creating or modifying classes and methods.
7. All custom exceptions must extend `AppError` (directly or via an intermediate class); never extend `Error` directly.
8. Follow the Registry pattern: add new collection managers as subclasses of `NamedRegistry`, overriding only the `notFoundException` static property.
9. Use static factory methods (`fromObject()`, `fromListObject()`) when creating model instances from raw config objects.
10. Always include the `.js` file extension in import statements.
11. Each commit must be unitary and atomic: one logical change per commit, with tests and implementation in the same commit. Never bundle unrelated changes together.
12. Every source file must act as a class declarer (define and export classes/modules), not a script. Only entrypoints (`source/bin/navi.js` and `dev/app/server.js`) may execute logic directly. Test files are exempt.
