# EmissionStore ring buffer + counters

Create `EmissionStore`, mirroring `source/lib/utils/memory/MemoryDataStore.js` for the
ring-buffer half and adding four monotonic counters.

Constructor `(retention = 100)`: `#records = []`, `#retention = retention`,
`#factory = new EmissionRecordFactory()`, and `#counts = { extracted: 0, emitted: 0, failed: 0, dead: 0 }`.

Ring-buffer API (identical semantics to `MemoryDataStore`):

- `recordEmission({ status, url, method, httpStatus, error, itemRef })` — builds an
  `EmissionRecord` via `#factory.build(...)`, `unshift`es it, `pop`s the oldest when
  `#records.length > #retention`, bumps the matching counter (`success` → `emitted`,
  `failed` → `failed`, `dead` → `dead`), and returns the record.
- `incExtracted(n = 1)` — `#counts.extracted += n`. No record is created (an extracted item
  with no `emit` config never becomes an emission).
- `getRecords()` → `[...#records].reverse()` (oldest-first).
- `getRecordById(id)` → `#records.find(r => r.id === id)`.
- `clear()` → `#records = []` **and** resets `#counts` to all-zero.
- `get size()` → `#records.length`.
- `get retention()` → `#retention`.
- `get counts()` → a shallow copy `{ ...#counts }` (never hand out the mutable internal object).
- `toJSON()` → `{ counts: this.counts, records: [...#records].reverse().map(r => r.toJSON()) }`.

JSDoc on every public method, `@author darthjee`.

Spec mirrors `source/spec/lib/utils/memory/MemoryDataStore_spec.js`: default/custom
retention, `recordEmission` adds + returns + assigns incremental ids, retention eviction
removes the oldest, `getRecords` oldest-first, `getRecordById` hit/miss, per-status counter
increments, `incExtracted` with and without an explicit `n`, `clear()` empties records and
zeroes counters, `counts` getter returns a copy (mutating the result doesn't affect the
store), `toJSON` shape. 100% diff coverage.

## Files to Change

- `source/lib/utils/emissions/EmissionStore.js` — new ring buffer + counters.
- `source/spec/lib/utils/emissions/EmissionStore_spec.js` — new spec.
