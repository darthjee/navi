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

### `background/`

Job/worker infrastructure:

- **`Job`** / **`Worker`** — abstract base classes; `Job` tracks failure count and last exception, `Worker` holds its UUID and registry references.
- **`JobRegistry`** / **`WorkersRegistry`** — static singleton façades backed by `JobRegistryInstance` / `WorkersRegistryInstance`. `JobRegistry` manages six queues (`enqueued`, `processing`, `failed`, `retryQueue`, `finished`, `dead`); `WorkersRegistry` manages idle/busy worker pools.
- **`JobFactory`** / **`WorkerFactory`** — instance creation; `WorkerFactory` assigns UUIDs via `IdGenerator`.

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
- **`utils/logging/`** — compatibility re-exports to `common/utils/logging/*`.
- **`utils/collections/`** — `Collection`, `IdentifyableCollection`, `Queue`, `SortedCollection`, plus `SortedArrayMerger` and `SortedArraySearcher`.
- **`utils/generators/`** — `IdGenerator`, `UUidGenerator`, `IncrementalIdGenerator`.
- **`utils/`** (flat) — `HtmlParser` (CSS selector extraction from HTML), `ResourceRequestCollector` (finds parameter-free requests for initial enqueueing).

### `services/`

Business logic and I/O layer:

- **`Application`** — static singleton façade; `loadConfig()` bootstraps registries and factories; `run()` starts engine and web server concurrently. Lifecycle methods (`pause`, `stop`, `continue`, `start`, `restart`) delegate to `ApplicationInstance`.
- **`Engine`** — allocation loop: each tick promotes cooled-down failed jobs then delegates to `WorkersAllocator`.
- **`Client`** — Axios-based HTTP executor; `perform()` for URL-template requests, `performUrl()` for absolute URLs; supports per-client headers with env var interpolation.
- **`ConfigLoader`** / **`ConfigParser`** / **`ArgumentsParser`** — config file I/O and CLI argument parsing.

### `server/`

Express-based web server. `Router` wires all request handlers and serves the React SPA from `source/static/`. Routes are declared as a config map of path → `HandlerConfig` instance; `HandlerConfig` holds the handler class and parameters and lazily constructs the handler on each request. Handlers extend `RequestHandler` (from `common/server/`) and are registered via `RouteRegister`, which maps domain errors to HTTP status codes (403/404/500). See [Web Server](web-server.md) for the full route reference.

Subfolders:

- `server/` — routing infrastructure: `WebServer`, `Router`, `RouteRegister`, `HandlerConfig`, `PathValidator`
- `server/handlers/` — general handlers: `AssetsRequestHandler`, `IndexRequestHandler`, `JobsFilter`, `LinksRequestHandler`, `LogsRequestHandler`, `SettingsRequestHandler`, `StatsRequestHandler`
- `server/handlers/engine/` — engine lifecycle handlers: `EngineContinueRequestHandler`, `EnginePauseRequestHandler`, `EngineRestartRequestHandler`, `EngineShutdownRequestHandler`, `EngineStartRequestHandler`, `EngineStatusRequestHandler`, `EngineStopRequestHandler`
- `server/handlers/jobs/` — job handlers: `JobLogsRequestHandler`, `JobRequestHandler`, `JobRetryRequestHandler`, `JobsRequestHandler`

## Test Layout

All specs live under `source/spec/`:

```
source/spec/
  lib/                  ← mirrors source/lib/ exactly
    background/
    enqueuers/
    exceptions/
      config/
      http/
      registry/
      request/
    factory/
    jobs/
    models/
      configs/
      request/
      response/
    registry/
    server/
      handlers/
        engine/
        jobs/
    common/
      utils/
        env_resolver/
      server/
    services/
    utils/
      logging/
      collections/
      generators/
      ResourceRequestCollector_spec.js
  support/              ← shared test helpers (factories, dummies, fixtures)
    dummies/
    factories/
    utils/
```

The naming convention for spec files is `<ClassName>_spec.js`, mirroring the source file's location under `source/lib/`.

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

- Unit tests: **Jasmine** (`spec/lib/**/*_spec.js` naming convention).
- Coverage: **c8** (`yarn test` runs `c8 jasmine spec/**/*.js`).
- Linting: **ESLint** (`yarn lint`).
- Duplication: **JSCPD** (`yarn report`).
- API docs: **JSDoc** (`yarn docs`; config: `source/jsdoc.json`).
- CI: **CircleCI**. Code quality: **Codacy**.

## Developer Workflow

Development workflow is Docker-based.

### Makefile Commands

| Command | Description |
|---------|-------------|
| `make setup` | Copies `.env.sample` to `.env`; copies `docker_volumes/config/navi_config.yml.sample` to `docker_volumes/config/navi_config.yml` (if absent); builds `base_build` service; installs Node dependencies via `yarn install`. |
| `make dev` | Runs the `navi_app` container with `/bin/bash`; allows interactive `yarn test`, `yarn lint`, etc. |
| `make tests` | Runs the `navi_tests` container with `/bin/bash` for an isolated test environment. |
| `make build-dev` | Builds the development Docker image tagged `navi:dev` from `dockerfiles/dev_navi_hey/Dockerfile`. |
| `make build` | Builds the production Docker image tagged `darthjee/navi-hey:latest` from `dockerfiles/production_navi_hey/Dockerfile`. |

### Directory Conventions

- Application source code must live in a folder named `source`.
- The `source` folder is mounted as a volume in `docker-compose.yml` for live development.
- Dockerfiles are stored under `dockerfiles/`.
- `docker_volumes/` is used for development/runtime mounted data:
  - `docker_volumes/config/` — YAML configuration files (never inside `source/`).
  - `docker_volumes/node_modules/` — Node modules cache mounted into the container.

## Implementation Guidelines

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
