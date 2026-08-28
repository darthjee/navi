# WorkersRegistry.ensureBuild + idempotent initWorkers

## `WorkersRegistry.ensureBuild(options = {})` (new static method)

In `worker/lib/background/WorkersRegistry.js`, next to `build`:

```js
static ensureBuild(options = {}) {
  if (!WorkersRegistry.#instance) {
    WorkersRegistry.build(options);
  }
  return WorkersRegistry.#instance;
}
```

- On an already-built singleton: pure no-op — no reconstruct, no `initWorkers`,
  `options` **ignored**. Returns the existing instance.
- `build()` is unchanged (still throws if already built).
- JSDoc must state explicitly: idempotent; first build wins; `options` ignored when
  already built; does not initialize workers (edge case E3).

## `WorkersRegistry.initWorkers()` — idempotent

`initWorkers()` delegates to `WorkersRegistryInstance#initWorkers()`. Add the guard
on the instance:

```js
initWorkers() {
  if (this.#workers.hasAny()) return;
  for (let i = 0; i < this.#quantity; i++) {
    this.#buildWorker();
  }
}
```

- `#workers` only ever grows (`#buildWorker` pushes; `setBusy`/`setIdle` move between
  `#busy`/`#idle` but never remove from `#workers`), so once initialized `hasAny()`
  stays true — safe.
- Must **not** also short-circuit on `#quantity`: `quantity: 0` leaves `#workers`
  empty, `hasAny()` false, and a repeat call harmlessly runs a 0-iteration loop
  (edge case E5).
- JSDoc: note it is now idempotent (safe to call more than once; only the first call
  populates the pool).

Confirm `IdentifyableCollection` exposes `hasAny()` (it is used elsewhere in this
class via the `#busy` / `#idle` collections) — reuse it, do not add a new predicate.

## Files to Change

- `worker/lib/background/WorkersRegistry.js` — new `ensureBuild` static + JSDoc.
- `worker/lib/background/WorkersRegistryInstance.js` — `initWorkers` idempotency guard + JSDoc.
