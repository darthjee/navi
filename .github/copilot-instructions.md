# Copilot Instructions

## Project Objective

Navi is a Node.js application designed to run inside Docker and be distributed as a Docker image.

Its primary purpose is to warm caches by performing HTTP requests based on a user-provided YAML configuration file mounted as a Docker volume.

## Documentation

Detailed documentation is split into focused files under `.github/docs/`:

| File | Contents |
|------|----------|
| [Architecture](docs/architecture.md) | Source code layout (`exceptions/`, `models/`, `registry/`, `services/`), module system, code style, tooling, developer workflow, and Copilot implementation guidelines. |
| [Runtime Flow](docs/flow.md) | CLI entrypoint (`navi.js`), config loading, initial enqueueing, Engine loop, worker execution, action-based resource chaining, failure handling, and future web UI. |

## Engineering Standards

- All pull requests must be written in English.
- All source code must be written in English.
- All comments and documentation must be written in English.

## Quick Reference

- **Run tests:** `yarn test` (via `make dev`)
- **Lint:** `yarn lint`
- **Build dev image:** `make build-dev`
- **Build prod image:** `make build`
- **Package manager:** Yarn (never `npm install`)
- **Module system:** ES Modules — always use `.js` extensions in imports
