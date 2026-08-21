# Plan: Move worker to a separated package

Issue: [656-move-worker-to-a-separated-package.md](../../issues/656-move-worker-to-a-separated-package.md)

## Overview

Extract the worker subsystem (`Worker`, `Job`, the registries, `Engine`, `WorkersAllocator`, collections, `Factory`, id generators) out of `source/` into a new top-level `worker/` package, published on npm as `deku-swarm`, following the `clients/node/` monorepo pattern. `engine` refactors the coupling and performs the move, `docker` mounts the new folder for local dev, `architect` wires CI/release tooling and establishes the new `worker` agent, and `docs` adds the version badges to `README.md`.

## Agents involved

- [engine](engine.md)
- [docker](docker.md)
- [architect](architect.md)
- [docs](docs.md)

## Shared contracts

- **Package identity**: npm package `deku-swarm`, `worker/package.json` with `main: "lib/index.js"`, starting `version: "1.6.2"`. `architect`'s `scripts/bump_version.sh worker` / `scripts/check_worker_tag_version.sh` and `docs`'s README badges both read this exact field — the field name and location must not change.
- **Public API surface** (`worker/lib/index.js`, produced by `engine`): `Worker, WorkerFactory, WorkersRegistry, Job, JobFactory, JobRegistry, Engine, WorkersAllocator, IdentifyableCollection, Queue, SortedCollection`. Navi imports these as `import { ... } from 'deku-swarm'`.
- **Dependency resolution path**: `source/package.json` gets `"deku-swarm": "file:../worker"` (produced by `engine`). `docker`'s compose mount must land the folder at the exact same relative location the container expects it (`./worker:/home/node/worker`, resolving `file:../worker` to `/home/node/worker/` from `/home/node/app`).
- **Constructor injection contracts** (internal to `engine`'s own work, but documented by `architect` in `docs/agents/worker.md`): `Worker` takes `{ loggerFactory }`; `Engine` takes `{ allocator, jobRegistry, workersRegistry, sleepMs, keepAlive, idleTimeoutMs, onIdleTimeout }`; `WorkersAllocator` takes `{ jobRegistry, workersRegistry }`.
- **Sequencing**: `docker`, `architect`, and `docs` all depend on `worker/` existing with its final shape — their steps only make sense after `engine`'s steps have landed. `architect`'s release step (tagging `worker-1.6.2`) is the very last step of the whole plan, after every other agent's work is merged.
