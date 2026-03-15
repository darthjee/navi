# Copilot Instructions

## Project Objective

Navi is a Node.js application designed to run inside Docker and be distributed as a Docker image.

Its primary purpose is to warm caches by performing HTTP requests based on a user-provided YAML configuration file mounted as a Docker volume.

## Runtime and Configuration Model

The application must read a `.yml` configuration file with a top-level `resources` key.

The configuration file may also define:

- **Execution settings**
  - Example: number of workers and runtime behavior.
- **Client settings**
  - Example: target domain/base URL and optional additional headers.
- **Resource settings**
  - Defined under the top-level `resources` key.
  - Example: resources such as `categories` or `category`.
  - Each resource item can define fields like `url`, expected `status`, and optional `resource` for chaining.

Each resource defines one or more request entries to fetch data, for example:

```yaml
workers:
  quantity: 5
clients:
  default:
    base_url: https://example.com
resources:
  categories:
    - url: /categories.html
      status: 302
    - url: /categories.html?ajax=true
      status: 200
    - url: /categories.json
      status: 200
      resource: category
  category:
    - url: /categories/{:id}.html
      status: 302
    - url: /categories/{:id}.html?ajax=true
      status: 200
    - url: /categories/{:id}.json
      status: 200
      resource: category_items
  category_items:
    - url: /categories/{:category_id}/items.html
      status: 302
    - url: /categories/{:category_id}/items.html?ajax=true
      status: 200
    - url: /categories/{:category_id}/items.json
      status: 200
      resource: category_item
  category_item:
    - url: /categories/{:category_id}/items/{:id}.html
      status: 302
    - url: /categories/{:category_id}/items/{:id}.html?ajax=true
      status: 200
    - url: /categories/{:category_id}/items/{:id}.json
      status: 200
```

Some URLs may produce data that links to other resources. For example:

- `/categories.json` returns a list of categories.
- For each category ID, the `category` resource is processed.
- For each category item ID, the `category_item` resource is processed.
- That enables requests such as `/categories/{:id}.json` and `/categories/{:category_id}/items/{:id}.json`.

This chaining model can continue recursively according to resource definitions.

URL templates may contain placeholders (for example, `{:id}` and `{:category_id}`) that are resolved from previously fetched resource data.

## Source Code Architecture

All application source code lives under the `source/` directory. The main library is organized into four subdirectories under `source/lib/`:

### `exceptions/`

Custom error classes following a strict inheritance hierarchy. All exceptions extend `AppError`, which automatically sets `error.name` from the subclass constructor name.

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

### `models/`

Data containers that map YAML configuration to typed instances. Most models expose static factory methods (`fromObject()`, `fromListObject()`) for creation from parsed YAML.

| Class | Responsibility |
|-------|---------------|
| `Config` | Top-level container holding ResourceRegistry, ClientRegistry, and WorkersConfig. Entry point: `Config.fromFile(filePath)`. |
| `Resource` | Named collection of `ResourceRequest` objects. |
| `ResourceRequest` | A single URL + expected HTTP status code. |
| `Worker` | Represents a worker thread; holds its UUID, `jobRegistry`, and `workersRegistry` references. |
| `Job` | Wraps a unit of work (payload) to be consumed from the queue. |
| `WorkersConfig` | Holds the worker pool size (`quantity`, default 1). |

### `registry/`

Collection managers built on a shared base class.

- **`NamedRegistry`** — Base class providing a generic `getItem(name)` lookup that throws the subclass-defined `notFoundException` when an item is missing.
- **`ResourceRegistry`** — Extends `NamedRegistry`; throws `ResourceNotFound`.
- **`ClientRegistry`** — Extends `NamedRegistry`; throws `ClientNotFound`. Adds smart default-client resolution via `getClient([name])`.
- **`JobRegistry`** — FIFO job queue with a locking mechanism. Key methods: `push(job)`, `pick()`, `hasJob()`, `lock(worker)`, `hasLock(worker)`.
- **`WorkersRegistry`** — Worker pool manager. Tracks workers in `idle` and `busy` maps. Key methods: `initWorkers()`, `setBusy(workerId)`, `setIdle(workerId)`.

### `services/`

Business logic and I/O layer.

| Class | Responsibility |
|-------|---------------|
| `Application` | Main orchestrator. `loadConfig(configPath)` initializes `config`, `jobRegistry`, and `workersRegistry`. |
| `ConfigLoader` | File I/O — reads YAML from disk using `fs.readFileSync` and the `yaml` library. |
| `ConfigParser` | Converts the parsed YAML object into model instances (validates required keys, builds registries). |
| `Client` | HTTP executor using Axios. `perform(resourceRequest)` fetches a URL and throws `RequestFailed` if the status does not match. |

## Processing Architecture

Navi uses a queue-based processing model:

- Start from one or more initial resources defined in the YAML configuration.
- Process each fetched result and enqueue follow-up resources generated from that result.
- Use workers to consume the queue concurrently.
- Worker behavior and concurrency are controlled by the `workers.quantity` configuration key.

### Queue and Worker Flow

```
Application
  └─ loadConfig()
       ├─ Config (ResourceRegistry, ClientRegistry, WorkersConfig)
       ├─ JobRegistry  ← FIFO queue, lock-based dequeuing
       └─ WorkersRegistry  ← idle/busy worker pool
              └─ Worker[] (each with a UUID)
                   └─ Client.perform(resourceRequest)  ← Axios HTTP call
```

## Operating Direction

Current direction:

- Focus on a command-line execution model for CI usage.
- React and React Bootstrap are already included as dependencies and must be available for a future local frontend to monitor and run jobs.

## Developer Operation Model

Development workflow must be Docker-based and include:

- A `docker-compose.yml` file with the development containers.
- A `Makefile` exposing the primary developer commands.

Required `Makefile` commands:

- `make setup`
  - Copies `.env.sample` to `.env`.
  - Builds the `base_build` service and installs Node dependencies via `yarn install`.
- `make dev`
  - Runs the `navi_app` container with `/bin/bash` as the entry command.
  - Allows the developer to run `yarn test`, `yarn lint`, and any other necessary commands interactively.
- `make tests`
  - Runs the `navi_tests` container with `/bin/bash` for an isolated test environment.
- `make build-dev`
  - Builds the development Docker image tagged as `navi:dev` from `dockerfiles/dev_navy/Dockerfile`.
- `make build`
  - Builds the production Docker image tagged as `navi:latest` from `dockerfiles/navy/Dockerfile`.

Source code location and mounting rules:

- Application source code must live in a folder named `source`.
- The `source` folder is mounted as a volume in `docker-compose.yml` for live development.

Docker files and volume structure:

- Dockerfiles must be stored under a `dockerfiles` folder.
- Expected structure:
  - Development image: `dockerfiles/dev_navy/Dockerfile`
  - Production image: `dockerfiles/navy/Dockerfile`
- A `docker_volumes` folder is used for development/runtime mounted data.
  - `docker_volumes/config/` — YAML configuration files (never inside `source/`).
  - `docker_volumes/node_modules/` — Node modules cache mounted into the container.

## Module System

The project uses **ES Modules** (`"type": "module"` in `package.json`).

- Use `import`/`export` syntax exclusively; CommonJS (`require`/`module.exports`) is not used.
- Always include the `.js` extension in import paths (e.g., `import Foo from './Foo.js'`).
- In test files, use `import.meta.url` for ESM-compatible path resolution when loading fixtures.

## Package Manager

Use **Yarn** for installing and managing dependencies. Do not use `npm install`.

## Engineering Standards

- All pull requests must be written in English.
- All source code must be written in English.
- All comments and documentation must be written in English.

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
