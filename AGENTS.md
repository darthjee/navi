# AGENTS.md

Shared instructions for all AI coding agents (Claude Code, GitHub Copilot, Cursor, etc.) working in this repository.

## Project Overview

Navi is a **queue-based cache-warmer** written in Node.js, designed to run inside Docker and be distributed as a Docker image.
It reads a YAML configuration file and performs HTTP requests concurrently using a configurable worker pool, with support for resource chaining and automatic retry of failed requests.

## Documentation

All project documentation lives under [`docs/agents/`](docs/agents/):

| File | Contents |
|------|----------|
| [Overview](docs/agents/overview.md) | What Navi is, the resource-chaining concept, and the implementation checklist (done vs. planned). |
| [Architecture](docs/agents/architecture.md) | Source layout, module system, code style, registries pattern, tooling, and implementation guidelines. |
| [Runtime Flow](docs/agents/flow.md) | CLI entrypoint, config loading, YAML structure, initial enqueueing, Engine loop, worker execution, failure handling, web UI routes. |
| [Contributing](docs/agents/contributing.md) | Explanation on how to contribute, commit and open PRs |
| [Dangers](docs/agents/dangers.md) | Async pitfalls, synchronous test dummies, and rules for planning cooldowns, sleeps, and waits. |
| [Dev Application](docs/agents/dev-app.md) | The sample backend used to test Navi: a dynamic Express (`dev/`) application, endpoints, classes, testing, CI jobs, and Docker Compose services. |
| [Dev Proxy](docs/agents/dev-proxy.md) | The Tent-powered reverse proxy (`dev/proxy`) used in local development: configuration files, caching behaviour, request flow, and how to extend the rules. |
| [Plans](docs/agents/plans/) | Implementation plans for ongoing or upcoming features. |
| [Issues](docs/agents/issues/) | Detailed specs for open GitHub issues. |

### Issues (`docs/agents/issues/`)

Each file documents a GitHub issue in detail. Naming convention:

```
docs/agents/issues/<github_issue_id>_<issue_name>.md
```

Example: `docs/agents/issues/5_release_docker_image.md` for issue #5.

### Plans (`docs/agents/plans/`)

Each plan is a directory named after the GitHub issue ID and topic, containing one or more related files:

```
docs/agents/plans/<github_issue_id>_<topic>/<related_files>.md
```

Example: `docs/agents/plans/66_remove-spec-duplications/plan.md` for issue #66.

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
