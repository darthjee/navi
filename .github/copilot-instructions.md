# Copilot Instructions

## Project Objective

Navi is a Node.js application designed to run inside Docker and be distributed as a Docker image.

Its primary purpose is to warm caches by performing HTTP requests based on a user-provided YAML configuration file mounted as a Docker volume.

## Documentation

All project documentation lives under [`docs/`](../docs/):

| File | Contents |
|------|----------|
| [Architecture](../docs/architecture.md) | Source layout, module system, code style, registries pattern, tooling, and implementation guidelines. |
| [Runtime Flow](../docs/flow.md) | CLI entrypoint, config loading, initial enqueueing, Engine loop, worker execution, failure handling. |
| [Plans](../docs/plans/) | Implementation plans for ongoing or upcoming features. |

## Engineering Standards

- All pull requests must be written in English.
- All source code must be written in English.
- All comments and documentation must be written in English.

## Quick Reference

- **Run tests:** `yarn test` (via `make tests`)
- **Lint:** `yarn lint`
- **Build dev image:** `make build-dev`
- **Build prod image:** `make build`
- **Package manager:** Yarn (never `npm install`)
- **Module system:** ES Modules — always use `.js` extensions in imports
