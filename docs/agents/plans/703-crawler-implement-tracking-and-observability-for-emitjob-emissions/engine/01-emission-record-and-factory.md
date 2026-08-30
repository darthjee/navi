# EmissionRecord and EmissionRecordFactory

Create the per-emission value object and its id-assigning factory, mirroring
`source/lib/utils/memory/MemoryData.js` and `MemoryDataFactory.js` exactly in shape.

`EmissionRecord` — private fields `#id`, `#status`, `#url`, `#method`, `#httpStatus`,
`#error`, `#itemRef`, `#timestamp`. Positional constructor
`(id, { status, url, method, httpStatus = null, error = null, itemRef = null })` (an id
plus an options object — the record has too many fields for an all-positional ctor).
`#timestamp = new Date()` set in the ctor. One getter per field. `toJSON()` returns
`{ id, status, url, method, httpStatus, error, itemRef, timestamp: this.#timestamp.toISOString() }`.
`error` is stored as a string (`String(error)` at the call site, or `null`).

`EmissionRecordFactory` — `constructor({ idGenerator = new IncrementalIdGenerator() } = {})`
(import from `../generators/IncrementalIdGenerator.js`). `build({ status, url, method, httpStatus, error, itemRef })`
generates the id via `this.#idGenerator.generate()` and returns
`new EmissionRecord(id, { status, url, method, httpStatus, error, itemRef })`.

JSDoc on every public method. `@author darthjee` on both classes (repo convention — see the
`MemoryData*` files).

Specs mirror `source/spec/lib/utils/memory/MemoryData_spec.js` /
`MemoryDataFactory_spec.js`: constructor stores fields, `toJSON()` shape and ISO timestamp,
factory assigns incremental ids starting at 1, factory accepts an injected `idGenerator`.
100% diff coverage.

## Files to Change

- `source/lib/utils/emissions/EmissionRecord.js` — new value object.
- `source/lib/utils/emissions/EmissionRecordFactory.js` — new factory with injected `IncrementalIdGenerator`.
- `source/spec/lib/utils/emissions/EmissionRecord_spec.js` — new spec.
- `source/spec/lib/utils/emissions/EmissionRecordFactory_spec.js` — new spec.
