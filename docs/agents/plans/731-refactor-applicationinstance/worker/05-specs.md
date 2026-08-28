# Worker specs

## `worker/spec/services/Engine_spec.js` (E4 audit + new coverage)

- Audit: every existing `new Engine({ ... })` in this file passes
  `jobRegistry: JobRegistry, workersRegistry: WorkersRegistry` explicitly, so the
  default change should not alter their behaviour. Confirm by running the file; do
  not pre-emptively rewrite.
- Add a small describe block: `new Engine({ sleepMs: -1 })` with **no** registries
  builds an allocator backed by the `JobRegistry` / `WorkersRegistry` singleton
  facades (e.g. assert `engine.allocator` is a `WorkersAllocator` and a
  `promoteReadyJobs` spy on `JobRegistry` is hit once the loop runs, or assert via
  behaviour that the facades are in use).
- Add a case that an **injected** registry still wins over the default (pass a
  stub object, assert the stub's method is the one called).

## `worker/spec/background/WorkersRegistry_spec.js`

- `ensureBuild` when not yet built → builds (subsequent `WorkersRegistry.stats()` /
  facade calls work) and returns the instance.
- `ensureBuild` when already built → returns the **same** instance, does not throw,
  and ignores the new `options` (e.g. build with `quantity: 1`, `ensureBuild({ quantity: 5 })`,
  assert pool still reflects 1 after `initWorkers`).
- `initWorkers` called twice → pool size unchanged after the second call.
- `initWorkers` with `quantity: 0` → no workers, second call still a harmless no-op.

## `worker/spec/background/JobRegistry_spec.js` (new file)

Minimal spec for the new method only (broader `JobRegistry` behaviour stays covered
from `source/spec/lib/registry/`):

- `ensureBuild` when not yet built → builds, returns the instance, `JobRegistry`
  facade calls work afterwards.
- `ensureBuild` when already built → same instance, no throw, `options` ignored.
- `afterEach` → `JobRegistry.reset()`.

## Files to Change

- `worker/spec/services/Engine_spec.js` — default-registry coverage + injected-wins case.
- `worker/spec/background/WorkersRegistry_spec.js` — `ensureBuild` + `initWorkers` idempotency cases.
- `worker/spec/background/JobRegistry_spec.js` — new file, `ensureBuild` cases.
