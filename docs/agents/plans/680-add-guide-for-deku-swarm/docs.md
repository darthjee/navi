# Docs Plan: Add guide for deku-swarm

Main plan: [plan.md](plan.md)

## Overview

Write a new hub guide, `docs/guides/HOW_TO_USE_DEKU_SWARM.md`, plus seven sub-pages under `docs/guides/deku-swarm/`, documenting the standalone `deku-swarm` npm package (`worker/`) for developers and AI agents integrating it into their own Node.js projects — independent of Navi.

## Context

- `deku-swarm` (`worker/`) is a zero-dependency, queue-based worker pool: subclass `Job`, implement `perform()`, and the package handles queuing, worker allocation, cooldown-based retry, and dead-lettering.
- Public API surface (`worker/lib/index.js`): `Worker`, `WorkerFactory`, `WorkersRegistry`, `Job`, `JobFactory`, `JobRegistry`, `Engine`, `WorkersAllocator`, `IdentifyableCollection`, `Queue`, `SortedCollection`.
- Existing sources to draw from: `worker/README.md` (npm-facing readme, API tables, quick-start) and `docs/agents/worker.md` (internal class-by-class architecture reference).
- Structural precedent: `docs/guides/HOW_TO_USE_NAVI-CLIENT.md` — title + short description paragraph + `## Table of Contents` linking relatively to `./deku-swarm/*.md`.
- All hub → sub-page links, and any cross-links between sub-pages, must be relative (`./deku-swarm/xxx.md` or `./xxx.md`) — readers copy these guide files into unrelated projects.
- The guide must be self-contained (no assumed familiarity with Navi) and instructional rather than a duplicate of `worker/README.md`'s reference tables.
- All code examples use ES Modules (`import`/`export` with `.js` extensions), matching `worker/README.md`'s existing examples and `worker/package.json`'s `"type": "module"`.

## Steps

- [01 — Write the hub guide](docs/01-write-hub-guide.md)
- [02 — Installation sub-page](docs/02-installation.md)
- [03 — Defining jobs sub-page](docs/03-defining-jobs.md)
- [04 — Setup sub-page](docs/04-setup.md)
- [05 — Running the engine sub-page](docs/05-running-the-engine.md)
- [06 — Job lifecycle sub-page](docs/06-job-lifecycle.md)
- [07 — Collections sub-page](docs/07-collections.md)
- [08 — Reference sub-page](docs/08-reference.md)

## Notes

- Ownership of the resulting files lives in `docs`' scope, following the same precedent as `HOW_TO_USE_NAVI-CLIENT.md` (owned by `docs` even though `clients/node/` itself is owned by `navi-client`).
- Updating `.claude/agents/docs.md`'s scope list (and the `docs` row in `.claude/agents/architect.md`'s specialist table) to add `docs/guides/HOW_TO_USE_DEKU_SWARM.md` and `docs/guides/deku-swarm/*.md` is `architect`'s own housekeeping, not part of this agent's deliverable — `architect` should make that edit directly when integrating this plan, matching architect.md's existing "when a new agent's scope changes, update this file and AGENTS.md" convention.
- Before writing API-level details (`Job` internals, `Engine` options, registry facade methods), cross-check exact current signatures/behavior against `worker/lib/**` and `docs/agents/worker.md` rather than relying solely on the issue text, in case the source has drifted since the issue was filed.
- No CI job in `.circleci/config.yml` covers `docs/` — no `## CI Checks` section applies here.
