# Update cross-cutting documentation

Reflect the new `worker/` package and agent across the repo's root-level and `docs/agents/` documentation (README.md's version badges are `docs`'s job, not this step's — see `docs.md`).

## Files to Change

- `AGENTS.md` — add a `worker/` row to the folder structure table (`deku-swarm`: the generic queue-and-pool worker package consumed by `source/`), and add a new Index entry pointing at `docs/agents/worker.md`, next to the existing `Worker Subsystem` entry (update that entry's description now that the subsystem lives in its own package).
- `docs/agents/worker.md` — update every path reference from `source/lib/...` to `worker/lib/...` for the classes that moved (`Worker`, `Job`, the registries, `Engine`, `WorkersAllocator`, collections, `Factory`, `IdGenerator`/`UUidGenerator`); keep references to what stayed in Navi (`ResourceEnqueuer`, `LogContext`, `IncrementalIdGenerator`, the injectable listeners) pointing at `source/lib/...` as before. Document the new constructor injection shapes from `engine/01-inject-dependencies.md`.
- `docs/agents/folder-structure.md` — add a `worker/` row describing it as the `deku-swarm` npm package.
- `docs/agents/flow/engine-and-workers.md` — update path references for moved classes and add a link to `docs/agents/worker.md`.

## Notes

- Do this after `engine`'s move (step 03 of `engine.md`) has landed, so the path references being written are accurate rather than speculative.
