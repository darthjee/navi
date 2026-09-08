# `worker/lib/`

Source for the `deku-swarm` package — a generic, domain-agnostic queue-and-pool
worker system. Immediate children only; nested class detail lives in
`docs/agents/worker.md`.

- `background/` — the queue-and-pool core: `Job`, `Worker`, their `*Factory` and
  `*Registry` / `*RegistryInstance` classes.
- `collections/` — internal storage primitives: `Collection`,
  `IdentifyableCollection`, `Queue`, `SortedCollection`, `SortedArrayMerger`,
  `SortedArraySearcher`.
- `generators/` — id generators: `IdGenerator`, `UUidGenerator`.
- `services/` — `Engine` (the main loop) and `WorkersAllocator` (matches ready
  jobs to idle workers).
- `Factory.js` — generic object-builder base class extended by `JobFactory` /
  `WorkerFactory`.
- `index.js` — package entry point; the public `deku-swarm` export surface.

## See also

[`docs/agents/worker.md`](../../docs/agents/worker.md) — the class-by-class reference for `deku-swarm` and how `source/` consumes it.
