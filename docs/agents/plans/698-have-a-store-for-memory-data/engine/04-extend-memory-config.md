# Extend MemoryConfig with data_store.size

Add a `data_store` option to `MemoryConfig`, following the same defaults-with-spread pattern already used for `thresholds` (`{ ...DEFAULT_THRESHOLDS, ...thresholds }`) and matching `LogConfig`'s `size` handling (default 100, no extra validation — see the Notes in [engine.md](../engine.md)).

- Destructure `data_store = {}` alongside `maximum`/`thresholds` in the constructor.
- Store the resolved size (`data_store.size ?? 100`, or `{ size: 100, ...data_store }.size` for consistency with the `thresholds` spread style — pick whichever reads more consistently with the surrounding code) in a new private field.
- Expose it via a getter — name it `dataStoreSize` (simplest, flat) unless a nested `{ size }` object getter reads better once the store is actually wired up; either is fine, just stay consistent with how `thresholds` exposes its object today.
- Update `WebConfig.js`'s JSDoc only: extend the `@param {object} [config.memory={}]` description to mention `data_store` (e.g. `` `{ maximum, thresholds, data_store }` ``). No constructor/runtime change is needed there — `WebConfig` already forwards the whole raw `memory` object into `new MemoryConfig(memory)`.

## Files to Change

- `source/lib/models/configs/MemoryConfig.js` — add `data_store = {}` to the constructor destructuring, a private field for the resolved size, and a getter for it.
- `source/lib/models/configs/MemoryConfig.spec.js` — add cases for the default size (100), a custom size, and that `data_store` doesn't interfere with existing `maximum`/`thresholds` behavior.
- `source/lib/models/configs/WebConfig.js` — JSDoc-only update to `@param {object} [config.memory={}]`.
