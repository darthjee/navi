# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Additional Documentation

See [`.github/copilot-instructions.md`](.github/copilot-instructions.md) for engineering standards (English-only code/comments/PRs) and pointers to detailed docs under `.github/docs/` (architecture, runtime flow).

## Project Overview

Navi is a **queue-based cache-warmer** written in Node.js. It reads a YAML configuration file and performs HTTP requests concurrently using a configurable worker pool, with support for resource chaining (downstream jobs enqueued from parent responses) and automatic retry of failed requests.

## Commands

All development happens inside Docker containers. From the project root:

```bash
make dev      # Open bash in app container (for running source code)
make tests    # Open bash in tests container (for running tests/lint)
make build    # Build production Docker image (navi:latest)
```

Inside the container (working directory is `source/`):

```bash
yarn test       # Run full test suite with coverage
yarn spec       # Run tests without coverage
yarn lint       # Run ESLint
yarn lint_fix   # Run ESLint with auto-fix
yarn report     # JSCPD copy-paste detection analysis
yarn docs       # Generate JSDoc documentation
```

### Running a single test

```bash
npx jasmine spec/models/Config_spec.js          # Single file
npx jasmine --filter="Config #getResource"      # Single test by name pattern
```

## Architecture

### Module System

Uses **ES Modules** (`import`/`export`). Always include `.js` extensions in import paths. Use **Yarn** (not npm).

### Source Layout (`source/`)

- `bin/navi.js` — CLI entrypoint; parses args, creates Application, loads config
- `lib/exceptions/` — Custom error hierarchy rooted at `AppError`
- `lib/models/` — Data containers mapping YAML config to typed instances
- `lib/registry/` — Collection managers (lookup, queuing, pooling)
- `lib/services/` — Business logic and I/O
- `lib/utils/` — Queue, IdGenerator, IdentifyableCollection
- `spec/` — Jasmine tests mirroring the `lib/` structure

### Runtime Flow

1. **CLI** → `ArgumentsParser` → `Application` loads config via `ConfigLoader` (YAML) + `ConfigParser` (builds registries/models)
2. **Engine** drives an allocation loop: `WorkersAllocator` assigns jobs from `JobRegistry` to idle workers in `WorkersRegistry`
3. **Worker** executes HTTP request via `Client` (Axios), parses the response, enqueues downstream actions
4. **Failure handling**: failed jobs go to a retry queue; jobs exceeding the retry limit go to `deadJobs`
5. Engine stops when no jobs remain and no workers are busy

### Registries Pattern

All registries extend `NamedRegistry`, which provides `getItem(name)` lookup with a configurable `notFoundException`. Key registries:

- `JobRegistry` — FIFO queue with separate `failed`, `finished`, and `deadJobs` queues
- `WorkersRegistry` — Worker pool with idle/busy state management
- `ClientRegistry` — HTTP client lookup with smart default-client resolution

### Code Style

- 2-space indentation, single quotes, `const`/`let`, strict equality (`===`)
- Max cyclomatic complexity: 10
- JSDoc on all public methods

## Testing

Tests use **Jasmine** (v5) with **c8** for coverage (80% threshold on branches, functions, lines, statements). Test files follow the pattern `spec/**/*[sS]pec.js` and mirror the `lib/` directory structure.
