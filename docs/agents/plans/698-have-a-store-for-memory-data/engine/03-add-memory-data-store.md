# Add the MemoryDataStore ring buffer

Create `MemoryDataStore`, mirroring `LogBuffer.js`'s ring-buffer mechanics 1:1: a private array, a private retention limit, and a private `MemoryDataFactory` instance. Only bring over the subset of `LogBuffer`'s API that makes sense for memory entries (no `getLogsByLevel`/`push`/`latestLog` equivalents unless a concrete need shows up) — `add`, `getEntries`, `getEntryById`, `clear`, `size`, `retention`, `toJSON`.

- `add(value, percentage)` — builds a `MemoryData` via the factory, `unshift`s it into the buffer, `pop`s the oldest entry once `retention` is exceeded, and returns the created entry (matching `LogBuffer.add`'s return value).
- `getEntries()` — `[...buffer].reverse()` (oldest-first, matching `LogBuffer.getLogs`).
- `getEntryById(id)` — `find()` by id.
- `clear()` — empties the buffer.
- `get size()` / `get retention()` — same as `LogBuffer`.
- `toJSON()` — `[...buffer].reverse().map(e => e.toJSON())`.

## Files to Change

- `source/lib/utils/memory/MemoryDataStore.js` — new class, constructor `(retention = 100)`, instantiates its own `MemoryDataFactory` internally (matching `LogBuffer`'s `this.#factory = new LogFactory()` — no DI needed here since `MemoryDataFactory` has no external dependency of its own beyond the id generator it already defaults).
- `source/lib/utils/memory/MemoryDataStore.spec.js` — new spec covering `add` (including retention eviction), `getEntries`, `getEntryById`, `clear`, `size`, `retention`, and `toJSON()`, mirroring `source/lib/common/utils/logging/LogBuffer.spec.js`.
