# Clear the store on engine stop

`EngineController.bind()` (`source/lib/services/engine/EngineController.js:97`) currently
wires:

```js
this.engine.on('stop', () => LogRegistry.clearBuffers());
```

Extend the same `stop` listener to also clear emission data, so a fresh run starts from
zero counters and an empty ring buffer (matching how per-job/per-worker log buffers reset):

```js
this.engine.on('stop', () => {
  LogRegistry.clearBuffers();
  EmissionRegistry.clear();
});
```

Import `EmissionRegistry` from `../../registry/EmissionRegistry.js`. `EmissionRegistry.clear()`
is a strict read-side helper (step 03), so in production it is always built by then via
`ApplicationConfigurator`; tests for this path must `build`/`reset` it.

## Specs

Extend `source/spec/lib/services/engine/EngineController_spec.js` (the `bind` / `stop`
event coverage): after emitting `stop`, `EmissionRegistry.clear()` has run (assert via a
spy, or by seeding a record + counter and checking `counts`/`getRecords()` are empty
afterwards). Build `EmissionRegistry` in `beforeEach` and `reset()` in `afterEach` for the
affected describe block. 100% diff coverage.

## Files to Change

- `source/lib/services/engine/EngineController.js` — `stop` listener also calls `EmissionRegistry.clear()`.
- `source/spec/lib/services/engine/EngineController_spec.js` — assert the store is cleared on `stop`.
