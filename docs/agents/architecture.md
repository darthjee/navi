# Architecture

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
├── InvalidResponseBody   ← raw JSON response body could not be parsed
├── NullResponse          ← parsed response body is null
├── MissingActionResource ← action config entry has no "resource" field
└── MissingMappingVariable ← variables_map references a field absent from the response
```

All custom exceptions must extend `AppError` (directly or via an intermediate class); never extend `Error` directly.

### `models/`

Data containers that map YAML configuration to typed instances.
Most models expose static factory methods (`fromObject()`, `fromListObject()`) for creation from parsed YAML.

| Class | Responsibility |
|-------|---------------|
| `Config` | Top-level container holding `ResourceRegistry`, `ClientRegistry`, `WorkersConfig`, and `WebConfig`. Entry point: `Config.fromFile(filePath)`. |
| `Resource` | Named collection of `ResourceRequest` objects, representing a server resource. |
| `ResourceRequest` | A single URL + expected HTTP status code + optional client name + optional actions list. Exposes `enqueueActions(rawBody, jobRegistry)` to enqueue action jobs after a successful HTTP request. |
| `ResourceRequestAction` | Represents a single action entry from the config (`resource` + optional `variables_map`). Uses `VariablesMapper` to transform a response item and logs the result. |
| `ResponseParser` | Parses a raw JSON string into a JS value. Throws `InvalidResponseBody` if the string cannot be parsed. |
| `ActionsEnqueuer` | Normalises a parsed response (object or array) and enqueues one `ActionProcessingJob` per `(item × action)` pair via `jobRegistry.enqueueAction`. Throws `NullResponse` for null responses. |
| `ActionsExecutor` | (Legacy — kept for reference.) Normalises a parsed response and dispatches each `ResourceRequestAction` per item synchronously. No longer called by `ResourceRequestJob`; removal is a follow-up. |
| `VariablesMapper` | Applies a `variables_map` to a response item, renaming fields as configured. When no map is provided, all fields pass through unchanged. Throws `MissingMappingVariable` when a source field is absent. |
| `Worker` | Represents a worker; holds its UUID, `jobRegistry`, and `workersRegistry` references. |
| `Job` | Abstract base class for all units of work. Tracks a failure counter (accessible as `_attempts` by subclasses) and last exception. |
| `ResourceRequestJob` | Extends `Job`. Performs an HTTP request for a `ResourceRequest`, then calls `resourceRequest.enqueueActions(rawBody, jobRegistry)` to enqueue action jobs. Receives a `jobRegistry` at build time. |
| `ActionProcessingJob` | Extends `Job`. Processes a single `(action, item)` pair by calling `action.execute(item)`. Exhausted after the first failure — no retry rights. |
| `WorkersConfig` | Holds the worker pool size (`quantity`, default 1) and the retry cooldown in milliseconds (`retryCooldown`, default 2000). |
| `WebConfig` | Holds the web UI configuration (`port`). Parsed from the optional `web:` top-level key; `null` when the key is absent, which disables the web server. |

### `registry/`

Collection managers built on a shared base class.

- **`NamedRegistry`** — Base class providing a generic `getItem(name)` lookup that throws the subclass-defined `notFoundException` when an item is missing.
- **`ResourceRegistry`** — Extends `NamedRegistry`; throws `ResourceNotFound`.
- **`ClientRegistry`** — Extends `NamedRegistry`; throws `ClientNotFound`. Adds smart default-client resolution via `getClient([name])`.
- **`JobRegistry`** — FIFO job queue. Key methods: `enqueue(resourceRequest, params)` (injects `jobRegistry: this` into every `ResourceRequestJob`), `enqueueAction({ action, item })` (creates an `ActionProcessingJob` via the `'Action'` factory), `pick()`, `hasJob()`, `lock(worker)`, `hasLock(worker)`. Also maintains `failed`, `finished`, and `deadJobs` queues.
- **`WorkersRegistry`** — Worker pool manager. Tracks workers in `idle` and `busy` maps. Key methods: `initWorkers()`, `setBusy(workerId)`, `setIdle(workerId)`, `hasBusyWorker()`, `hasIdleWorker()`.

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
| `ResourceRequestCollector` | Iterates a `ResourceRegistry` and enqueues one job per resource+parameter combination. |

### `services/`

Business logic and I/O layer.

| Class | Responsibility |
|-------|---------------|
| `Application` | Main orchestrator. `loadConfig(configPath)` initializes `config`, `jobRegistry`, and `workersRegistry`. Registers the `'ResourceRequestJob'` and `'Action'` factories. Enqueues initial parameter-free resources on startup. Optionally starts the web UI when `web:` is present in configuration. |
| `ConfigLoader` | File I/O — reads YAML from disk using `fs.readFileSync` and the `yaml` library. |
| `ConfigParser` | Converts the parsed YAML object into model instances (validates required keys, builds registries). |
| `Client` | HTTP executor using Axios. `perform(resourceRequest, params)` fetches a URL with `responseType: 'text'` and throws `RequestFailed` if the status does not match. |
| `Engine` | Drives the main allocation loop. Continuously calls the `WorkersAllocator` to assign jobs to workers as long as there are jobs to process or busy workers. Stops when all jobs are processed and all workers are idle. |
| `WorkersAllocator` | Handles the logic for assigning jobs to workers. Provides extensible methods for allocation, allowing custom strategies and easier testing. Used by `Engine` to decouple job assignment from engine control flow. |
| `JobFactory` | Creates `Job` instances from a `ResourceRequest` and a parameter map. Exposes three static methods for centralized factory management: `registry(name, factory)` registers a factory instance under a name, `get(name)` retrieves it, and `reset()` clears all registered factories (useful for test isolation). |
| `WorkersFactory` | Creates and initializes `Worker` instances for the pool   ← planned; not yet implemented. |
| `WebServer` | Optional Express.js server that serves the monitoring web UI. Created via `WebServer.build()`; returns `null` when `webConfig` is absent. Listens on the port defined by `WebConfig`. |
| `Router` | Defines the Express routes for the web UI. Exposes `GET /stats.json` returning combined job and worker statistics. |

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
| `make build-dev` | Builds the development Docker image tagged `navi:dev` from `dockerfiles/dev_navy/Dockerfile`. |
| `make build` | Builds the production Docker image tagged `navi:latest` from `dockerfiles/navy/Dockerfile`. |

### Directory Conventions

- Application source code must live in a folder named `source`.
- The `source` folder is mounted as a volume in `docker-compose.yml` for live development.
- Dockerfiles are stored under `dockerfiles/`:
  - Development image: `dockerfiles/dev_navy/Dockerfile`
  - Production image: `dockerfiles/navy/Dockerfile`
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
