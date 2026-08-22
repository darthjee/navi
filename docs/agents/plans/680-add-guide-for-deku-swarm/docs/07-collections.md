# Collections sub-page

Create `docs/guides/deku-swarm/collections.md` covering the collection primitives (`worker/lib/collections/`) — framed for readers who want to use them standalone (e.g. building a custom registry) rather than through `JobRegistry`/`WorkersRegistry`:

- `Queue` — plain FIFO push/pick; the simplest building block.
- `IdentifyableCollection` — O(1) keyed lookup by id, used where the registries need to fetch/remove a specific job or worker directly.
- `SortedCollection` — lazy-sorted storage, with `upTo`/`after` accessors; this is what backs cooldown-ordered retry scheduling (jobs "ready by" a given time).
- `IdGenerator` vs. `UUidGenerator` (`worker/lib/generators/`) — the two id-generation strategies available when building factories/registries, and when to reach for each (sequential/incrementing ids vs. universally-unique ids).
- A short example showing one of these used standalone (e.g. a `SortedCollection` holding arbitrary timestamped items), to make clear these are general-purpose, not `Job`/`Worker`-specific.
- Note explicitly (matching `worker/README.md`) that most consumers never touch this layer directly — it's exported for advanced/custom use cases.

## Files to Change

- `docs/guides/deku-swarm/collections.md` — new sub-page.
