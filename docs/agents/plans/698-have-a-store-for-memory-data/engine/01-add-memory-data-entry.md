# Add the MemoryData entry class

Create `MemoryData`, a dedicated entry model for a single memory reading — analogous to `Log.js`, but with its own fields (`value`, `percentage`, `timestamp`), not `level`/`message`/`attributes`. Use private fields and a `toJSON()` method, matching `Log.js`'s shape exactly (constructor takes an id plus the entry's own data; timestamp is captured internally at construction time, not passed in — see `Log.js`'s `this.#timestamp = new Date()`).

Fields:
- `id` (number) — assigned by the factory
- `value` (number) — the raw RSS reading, in bytes
- `percentage` (number) — `value` as a percentage of the configured memory maximum
- `timestamp` (Date, captured at construction) — serializes via `toISOString()` in `toJSON()`

## Files to Change

- `source/lib/utils/memory/MemoryData.js` — new class, `constructor(id, value, percentage)`, getters for `id`/`value`/`percentage`/`timestamp`, and `toJSON()` returning `{ id, value, percentage, timestamp }`.
- `source/lib/utils/memory/MemoryData.spec.js` — new spec covering the constructor, all getters, and `toJSON()`, mirroring `source/lib/common/utils/logging/Log.spec.js`'s coverage shape (100% diff coverage).
