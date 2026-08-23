# Add the MemoryDataFactory

Create `MemoryDataFactory`, mirroring `LogFactory.js` exactly: it injects an `IncrementalIdGenerator` (defaulting to `new IncrementalIdGenerator()`), assigns the next id, and builds a `MemoryData` instance from the caller-supplied `value`/`percentage`.

## Files to Change

- `source/lib/utils/memory/MemoryDataFactory.js` — new class, constructor `{ idGenerator = new IncrementalIdGenerator() } = {}` (import from `../generators/IncrementalIdGenerator.js`), method `build(value, percentage)` returning `new MemoryData(id, value, percentage)`.
- `source/lib/utils/memory/MemoryDataFactory.spec.js` — new spec covering the default id generator, an injected id generator, and `build()`'s returned instance, mirroring `source/lib/common/utils/logging/LogFactory.spec.js`.
