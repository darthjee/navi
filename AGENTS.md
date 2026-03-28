# AGENTS.md

Shared instructions for all AI coding agents (Claude Code, GitHub Copilot, Cursor, etc.) working in this repository.

## Project Overview

Navi is a **queue-based cache-warmer** written in Node.js, designed to run inside Docker and be distributed as a Docker image.
It reads a YAML configuration file and performs HTTP requests concurrently using a configurable worker pool, with support for resource chaining and automatic retry of failed requests.

## Documentation

All project documentation lives under [`docs/`](docs/):

| File | Contents |
|------|----------|
| [Architecture](docs/architecture.md) | Source layout, module system, code style, registries pattern, tooling, and implementation guidelines. |
| [Runtime Flow](docs/flow.md) | CLI entrypoint, config loading, initial enqueueing, Engine loop, worker execution, failure handling. |
| [Plans](docs/plans/) | Implementation plans for ongoing or upcoming features. |
| [Issues](docs/issues/) | Detailed specs for open GitHub issues. |

## Engineering Standards

- All source code, comments, documentation, and PRs must be written in English.
- Use **ES Modules** (`import`/`export`) with `.js` extensions in all import paths.
- Use **Yarn** (never `npm install`).
- 2-space indentation, single quotes, `const`/`let`, strict equality (`===`).
- JSDoc on all public methods.

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
