# Establish the worker agent and trim engine's scope

Create a new `worker` specialist agent scoped to everything inside `worker/`, modeled directly on `navi-client` (which owns `clients/node/` the same way). Trim `engine`'s documented scope so the two together still cover every file that used to be under `engine`, with no gap and no overlap. Update `architect.md`'s own "Specialist agents" table to add the new row.

## `.claude/agents/worker.md` (new file)

Model closely on `.claude/agents/navi-client.md`'s shape (frontmatter, "Your scope", "Stack", "Commands", "Conventions"):

- Frontmatter: `name: worker`, `description: Navi worker specialist. Use for any task involving worker/ — the deku-swarm package: a generic queue-and-pool worker system (Worker, Job, the registries, Engine, WorkersAllocator, collections, Factory, id generators).`, `tools: Read, Edit, Write, Bash`.
- Scope: everything inside `worker/` — `lib/background/`, `lib/services/`, `lib/collections/`, `lib/Factory.js`, `lib/generators/`, `lib/index.js`, `spec/` mirroring `lib/`, `package.json`, `eslint.config.mjs`.
- Explicitly out of scope: `source/` (owned by `engine`, the consumer of this package), `clients/node/`, `frontend/`, `dev/`. `worker/README.md` ownership: same convention as `clients/node/README.md` (owned by `docs`) — flag this choice for the `docs` agent's own step, don't just assume it.
- Stack section: Node.js ESM, Yarn, Jasmine/c8/ESLint/JSCPD — same tooling as `clients/node/`, no runtime dependencies of its own beyond dev tooling.
- Commands: `cd worker && yarn install && yarn coverage && yarn lint && yarn report`, matching `worker/package.json`'s scripts from `engine/02-create-worker-package-skeleton.md`.
- Versioning: bumped independently via `scripts/bump_version.sh worker [version]`, never by hand — link to `docs/agents/contributing.md`.

## `.claude/agents/engine.md` — trim scope

Remove from "Your scope":
- `lib/background/` — `Worker`/`Job` base classes, `JobRegistry`/`WorkersRegistry` (moved to `worker`)
- The parts of `lib/services/` that were `Engine.js`/`WorkersAllocator.js` (moved to `worker`) — keep `ApplicationInstance`, `Client`, config loading/parsing, `EngineEvents`, `EngineStopService`, `FailureChecker`, `RunSummary`
- `lib/factory/` — generic `Factory` object-builder (moved to `worker`)
- The collections/id-generator parts of `lib/utils/` — `collections/`, `generators/IdGenerator.js`, `generators/UUidGenerator.js` (moved to `worker`; `generators/IncrementalIdGenerator.js` and `logging/` stay)

Add a line noting `engine` now consumes `Worker`/`Job`/the registries/`Engine`/`WorkersAllocator` from the `deku-swarm` npm package (`worker/`, owned by the new `worker` agent) instead of owning them directly, and that `lib/jobs/` (concrete `Job` subclasses) still belongs to `engine` since those are Navi domain implementations, not generic worker code.

## `.claude/agents/architect.md` — add the new agent row

Add a row to the "Specialist agents" table: `| \`worker\` | \`worker/\` — the \`deku-swarm\` npm package: a generic queue-and-pool worker system |`.

## Files to Change

- `.claude/agents/worker.md` — new file, as described above.
- `.claude/agents/engine.md` — trim "Your scope" as described above.
- `.claude/agents/architect.md` — add the `worker` row to the "Specialist agents" table.
