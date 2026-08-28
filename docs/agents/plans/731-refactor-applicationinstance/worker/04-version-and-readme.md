# Version bump + README

## `worker/package.json`

- `"version": "1.7.0"` → `"version": "1.8.0"`. Minor bump — the changes are purely
  additive (`ensureBuild` methods are new; `Engine` defaults only fire on
  `undefined`; `initWorkers` idempotency is a no-op for existing callers).
- Nothing else in that file changes.

## `worker/README.md`

Update the deku-swarm API reference to match:

- `Engine` constructor param table row for `jobRegistry` / `workersRegistry`:
  change from "Required. Any object exposing the same method names..." to note they
  now **default to the `JobRegistry` / `WorkersRegistry` static facades** when
  omitted; pass an instance for explicit DI.
- `WorkersRegistry.build(options)` row: add a sibling `WorkersRegistry.ensureBuild(options)`
  row — "Builds the singleton only if not already built; a pure no-op (options
  ignored) once built. Returns the instance."
- Add a `JobRegistry.ensureBuild(options)` row wherever `JobRegistry.build` is
  documented, same wording.
- Where `initWorkers()` / worker-pool setup is described, note it is idempotent
  (only the first call populates the pool).
- The inline `new Engine({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, sleepMs: 500 })`
  example can stay as-is (still valid) or be simplified to `new Engine({ sleepMs: 500 })`
  — prefer showing the simplified form plus a one-line note that the registries are
  optional now.

## Files to Change

- `worker/package.json` — version `1.8.0`.
- `worker/README.md` — `Engine` param table, `ensureBuild` rows for both registries, `initWorkers` idempotency note.
