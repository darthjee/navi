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
└── LockedByOtherWorker
```

All custom exceptions must extend `AppError` (directly or via an intermediate class); never extend `Error` directly.

### `models/`

Data containers that map YAML configuration to typed instances.
Most models expose static factory methods (`fromObject()`, `fromListObject()`) for creation from parsed YAML.

| Class | Responsibility |
|-------|---------------|
| `Config` | Top-level container holding `ResourceRegistry`, `ClientRegistry`, `WorkersConfig`, and `WebConfig`. Entry point: `Config.fromFile(filePath)`. |
| `Resource` | Named collection of `ResourceRequest` objects, representing a server resource. |
| `ResourceRequest` | A single URL + expected HTTP status code + optional client name + optional actions list. |
| `Worker` | Represents a worker; holds its UUID, `jobRegistry`, and `workersRegistry` references. |
| `Job` | Wraps a unit of work (payload) to be consumed from the queue. Tracks a failure counter and last exception. |
| `WorkersConfig` | Holds the worker pool size (`quantity`, default 1). |
| `WebConfig` | Holds the web UI configuration (`port`). Parsed from the optional `web:` top-level key; `null` when the key is absent, which disables the web server. |

### `registry/`

Collection managers built on a shared base class.

- **`NamedRegistry`** — Base class providing a generic `getItem(name)` lookup that throws the subclass-defined `notFoundException` when an item is missing.
- **`ResourceRegistry`** — Extends `NamedRegistry`; throws `ResourceNotFound`.
- **`ClientRegistry`** — Extends `NamedRegistry`; throws `ClientNotFound`. Adds smart default-client resolution via `getClient([name])`.
- **`JobRegistry`** — FIFO job queue. Key methods: `enqueue(resourceRequest, params)`, `push(job)`, `pick()`, `hasJob()`, `lock(worker)`, `hasLock(worker)`. Also maintains `failed`, `finished`, and `deadJobs` queues.
- **`WorkersRegistry`** — Worker pool manager. Tracks workers in `idle` and `busy` maps. Key methods: `initWorkers()`, `setBusy(workerId)`, `setIdle(workerId)`, `hasBusyWorker()`, `hasIdleWorker()`.

Follow the Registry pattern: add new collection managers as subclasses of `NamedRegistry`, overriding only the `notFoundException` static property.

### `services/`

Business logic and I/O layer.

| Class | Responsibility |
|-------|---------------|
| `Application` | Main orchestrator. `loadConfig(configPath)` initializes `config`, `jobRegistry`, and `workersRegistry`. Enqueues initial parameter-free resources on startup. Optionally starts the web UI when `web:` is present in configuration. |
| `ConfigLoader` | File I/O — reads YAML from disk using `fs.readFileSync` and the `yaml` library. |
| `ConfigParser` | Converts the parsed YAML object into model instances (validates required keys, builds registries). |
| `Client` | HTTP executor using Axios. `perform(resourceRequest, params)` fetches a URL and throws `RequestFailed` if the status does not match. |
| `Engine` | Drives the main allocation loop. Continuously calls the `WorkersAllocator` to assign jobs to workers as long as there are jobs to process or busy workers. Stops when all jobs are processed and all workers are idle. |
| `WorkersAllocator` | Handles the logic for assigning jobs to workers. Provides extensible methods for allocation, allowing custom strategies and easier testing. Used by `Engine` to decouple job assignment from engine control flow. |
| `JobFactory` | Creates `Job` instances from a `ResourceRequest` and a parameter map. |
| `WorkersFactory` | Creates and initializes `Worker` instances for the pool   ← planned; not yet implemented. |
| `ResponseParser` | Parses HTTP response bodies and extracts parameters for downstream action enqueueing. |
| `WebServer` | Optional Express.js server that serves the monitoring web UI. Created via `WebServer.build()`; returns `null` when `webConfig` is absent. Listens on the port defined by `WebConfig`. |
| `Router` | Defines the Express routes for the web UI. Exposes `GET /stats.json` returning combined job and worker statistics. |

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

- Unit tests must use **Jasmine** (`spec/**/*_spec.js` naming convention).
- Code coverage must use **c8** (`yarn test` runs `c8 jasmine spec/**/*.js`).
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
12. Every source file must act as a class declarer (define and export classes/modules), not a script. Only entrypoints (`source/bin/navi.js` and `dev/server.js`) may execute logic directly. Test files are exempt.
