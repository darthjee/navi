# engine Plan: Move worker to a separated package

Main plan: [plan.md](plan.md)

## Shared contracts

- Produce `worker/lib/index.js`'s public API exactly as: `Worker, WorkerFactory, WorkersRegistry, Job, JobFactory, JobRegistry, Engine, WorkersAllocator, IdentifyableCollection, Queue, SortedCollection`.
- Produce `worker/package.json` with `name: "deku-swarm"`, `main: "lib/index.js"`, `version: "1.6.2"` — `architect` and `docs` read this field later.
- Add `"deku-swarm": "file:../worker"` to `source/package.json`'s `dependencies` — `docker` mounts `./worker` at `/home/node/worker` so this resolves inside the container.
- `Worker` constructor takes `{ loggerFactory }`; `Engine` constructor takes `{ allocator, jobRegistry, workersRegistry, sleepMs, keepAlive, idleTimeoutMs, onIdleTimeout }`; `WorkersAllocator` constructor takes `{ jobRegistry, workersRegistry }` — `architect` documents these shapes in `docs/agents/worker.md`.

## Steps

- [01 — Inject JobRegistry/WorkersRegistry/logger dependencies](engine/01-inject-dependencies.md)
- [02 — Create the worker/ package skeleton](engine/02-create-worker-package-skeleton.md)
- [03 — Move worker source and specs into worker/](engine/03-move-worker-source-and-specs.md)
- [04 — Make Navi consume deku-swarm](engine/04-navi-consumes-deku-swarm.md)

## CI Checks

- `source/`: `yarn coverage && yarn lint && yarn report` (CI jobs: `jasmine`, `checks`)
- `worker/` (once Phase 2 below creates it — no CI job wires it up yet, that's `architect`'s job in a later step; run locally before handing off): `cd worker && yarn install && npm run coverage && npm run lint && npm run report`

## Notes

- All four steps must land, in order, before `docker`, `architect`, or `docs` can meaningfully do their part — `worker/` doesn't exist until step 02, and Navi doesn't compile against it until step 04.
- Existing tests (`Engine_spec.js`, `Engine_async_spec.js`, `WorkersAllocator_spec.js`, `Worker_spec.js`) must be updated in step 01 to pass dependencies via constructor in mocks. No behavior change is expected anywhere in this plan — only import paths and dependency wiring change.
