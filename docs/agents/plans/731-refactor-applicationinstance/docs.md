# docs Plan: Refactor ApplicationInstance

Main plan: [plan.md](plan.md)

## Shared contracts

Consumes the `deku-swarm` API changes produced by the `worker` agent — see
[plan.md](plan.md) "Shared contracts". Relevant here:

- `Engine` constructor `jobRegistry` / `workersRegistry` are now **optional**,
  defaulting to the `JobRegistry` / `WorkersRegistry` static facades.
- New `WorkersRegistry.ensureBuild(options)` and `JobRegistry.ensureBuild(options)`
  — build once, pure no-op (options ignored) once built.
- `WorkersRegistry.initWorkers()` is idempotent.
- `build()` on both registries still "throws if already built".

Scope note: the issue did not enumerate the guides, but these files currently
document the changed surface as "Required" / "Throws if already built" with no
`ensureBuild`, so they become inaccurate without this update. Keep edits tight to
the changed rows.

## Implementation Steps

### Step 1 — Engine registry args in the guides

- `docs/guides/deku-swarm/running-the-engine.md`: the param table row
  `jobRegistry` / `workersRegistry` currently says "Required." Change to note they
  default to the `JobRegistry` / `WorkersRegistry` static facades when omitted, and
  that an instance can be passed for explicit DI. The two `new Engine({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, ... })`
  code samples stay valid; optionally simplify the first to `new Engine({ ... })`
  with a one-line note.
- `docs/guides/deku-swarm/reference.md`: same edit to the `Engine` constructor /
  param table row (`jobRegistry` / `workersRegistry` "Required" → optional with the
  facade default). Also update the `WorkersAllocator` row only if it repeats the
  "Required" wording in a way that now reads wrong (it inherits from `Engine`'s
  contract).

### Step 2 — ensureBuild + initWorkers idempotency in the guides

- `docs/guides/deku-swarm/reference.md`: in the `WorkersRegistry` method table, add
  `WorkersRegistry.ensureBuild(options)` next to `build(options)` — "Builds the
  singleton only if not already built; a pure no-op (options ignored) once built;
  returns the instance." Add the symmetric `JobRegistry.ensureBuild(options)` row in
  the `JobRegistry` table. Keep the existing `build(options)` "Throws if already
  built" wording. Note `initWorkers()` is idempotent where it appears.
- `docs/guides/deku-swarm/setup.md`: the `WorkersRegistry.build(options)` explanation
  block — add a sentence introducing `ensureBuild` as the idempotent variant used
  when bootstrap may run more than once, and mention `JobRegistry.ensureBuild`
  alongside the `JobRegistry.build` reference.

## Files to Change

- `docs/guides/deku-swarm/running-the-engine.md` — `Engine` `jobRegistry` / `workersRegistry` now optional.
- `docs/guides/deku-swarm/reference.md` — `Engine` param rows; `ensureBuild` rows for both registries; `initWorkers` idempotency note.
- `docs/guides/deku-swarm/setup.md` — `ensureBuild` mention for both registries.

## Notes

- Do not touch `docs/guides/deku-swarm/installation.md`, `defining-jobs.md`,
  `job-lifecycle.md`, `collections.md` — unaffected.
- `HOW_TO_USE_DEKU_SWARM.md` is an index/entry point; only touch it if it inlines
  the changed API (it should not).
