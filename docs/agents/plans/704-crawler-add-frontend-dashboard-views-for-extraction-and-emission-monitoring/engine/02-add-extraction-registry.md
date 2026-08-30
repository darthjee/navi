# Add the ExtractionRegistry facade

Create a static singleton facade for the extraction store, a structural copy of `source/lib/registry/EmissionRegistry.js` + `source/lib/registry/EmissionRegistryInstance.js`.

`ExtractionRegistryInstance`:
- `constructor({ retention } = {})` — `#store = new ExtractionStore(retention)`.
- `get store`, `get counts` (`#store.counts`).
- `recordExtraction(details)` — returns `#store.recordExtraction(details)`.
- `getRecords({ lastId } = {})` — `new LogFilter(this.#store.getRecords()).filter({ lastId })`, identical to `EmissionRegistryInstance`.
- `getRecordById(id)`, `clear()`.

`ExtractionRegistry` (static facade), same asymmetric strictness as `EmissionRegistry`:
- `build(options = {})` — throws if already built; stores `new ExtractionRegistryInstance(options)`.
- `reset()` — nulls the instance (test teardown).
- `recordExtraction(details)` — **no-ops** when not built (so `ExtractionJob` can call it unconditionally), otherwise returns the created record.
- `getRecords({ lastId })`, `getRecordById(id)`, `get counts`, `clear()` — **throw** when not built (via a private `#getInstance()`).

## Files to Change

- `source/lib/registry/ExtractionRegistryInstance.js` — new; copy of `EmissionRegistryInstance.js`.
- `source/lib/registry/ExtractionRegistry.js` — new; copy of `EmissionRegistry.js`, with `recordExtraction` as the only write helper (no-op when unbuilt) and `getRecords`/`getRecordById`/`counts`/`clear` as throwing read helpers.
