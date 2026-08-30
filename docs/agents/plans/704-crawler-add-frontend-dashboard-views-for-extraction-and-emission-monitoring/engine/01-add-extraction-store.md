# Add the extraction record store

Create a per-extraction ring-buffer store under `source/lib/utils/extractions/`, a structural copy of `source/lib/utils/emissions/*` adapted to extraction fields. One `ExtractionRecord` is created per `ExtractionJob` run (not per item).

`ExtractionRecord` fields: `id` (incremental), `parserType` (string), `originUrl` (string | null), `itemCount` (number), `timestamp` (Date). `toJSON()` serializes `timestamp` as `.toISOString()`, same as `EmissionRecord`.

`ExtractionStore`:
- `constructor(retention = 100)` — `#records = []`, `#counts = { extracted: 0 }`.
- `recordExtraction({ parserType, originUrl, itemCount })` — build a record via the factory, `unshift`, evict oldest past `#retention`, add `itemCount` to `#counts.extracted`, return the record.
- `getRecords()` — oldest-first (`[...#records].reverse()`), same as `EmissionStore`.
- `getRecordById(id)`, `clear()` (resets `#records` and `#counts.extracted = 0`), `get size`, `get retention`, `get counts` (shallow copy `{ extracted }`), `toJSON()` (`{ counts, records: [...].reverse().map(toJSON) }`).

`ExtractionRecordFactory` — copy `EmissionRecordFactory`: takes an optional `IncrementalIdGenerator` (`source/lib/utils/generators/IncrementalIdGenerator.js`), `build({ parserType, originUrl, itemCount })` assigns the next id and returns a new `ExtractionRecord`.

## Files to Change

- `source/lib/utils/extractions/ExtractionRecord.js` — new; copy of `EmissionRecord.js` with fields `parserType`, `originUrl`, `itemCount`.
- `source/lib/utils/extractions/ExtractionRecordFactory.js` — new; copy of `EmissionRecordFactory.js`.
- `source/lib/utils/extractions/ExtractionStore.js` — new; copy of `EmissionStore.js`, `#counts` limited to `{ extracted }`, `recordExtraction` in place of `recordEmission`/`incExtracted`.
