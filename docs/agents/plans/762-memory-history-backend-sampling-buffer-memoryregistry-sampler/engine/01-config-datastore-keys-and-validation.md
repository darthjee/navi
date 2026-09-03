# data_store config keys + interval validation

Extend the `data_store` block parsed by `MemoryConfig` with two new keys and validate
one of them. This is the foundation — the sampler and the registry bootstrap both read
`memoryConfig`.

## What to do

- In `MemoryConfig`'s constructor, add to the existing `data_store` destructure (which
  already yields `size`, default 100 via the `{ default, ...block }.key` merge idiom):
  - `interval` — seconds between RSS samples, default `5`. Expose as
    `memoryConfig.dataStoreInterval`.
  - `page_size` — max entries the future `/memory/history.json` will return, default `20`
    (matches `web.logs_page_size`). Expose as `memoryConfig.dataStorePageSize`. Nothing
    reads it yet — it is landed ahead of its consumer, exactly as `size` was.
- Validate `interval` in the constructor: it must be a finite number `> 0` (floats
  allowed — `0.5` → 500 ms). On violation throw a new `InvalidMemoryDataStore`.
  - `size` and `page_size` are **not** validated — taken raw, matching `LogConfig` /
    `EmitConfig` / `ExtractionConfig`. The rationale (a bad `interval` busy-loops the
    event loop; a bad `size` only degrades gracefully) is in the issue's _Validation_
    section — do not add bounds to `size`/`page_size`.
- New `source/lib/exceptions/config/InvalidMemoryDataStore.js` — `extends AppError`,
  structured like `InvalidMemoryThresholds` (message naming the offending key + value,
  plus a field carrying the bad value).
- Update the `MemoryConfig` class JSDoc: document `data_store.interval` /
  `data_store.page_size`, and note the retained window ≈ `size × interval` (~8 min at
  defaults).
- Spec: extend `describe('data_store')` in `MemoryConfig_spec.js` per the issue's
  _Testing strategy_ — defaults (`interval` 5, `size` 100, `page_size` 20); overrides;
  fractional `interval` accepted; `throws InvalidMemoryDataStore` for `interval` of `0`,
  negative, and `NaN`/non-numeric; `size: -1` and `page_size: 0` pass through without
  throwing (test name should record the asymmetry is deliberate).

## Files to Change

- `source/lib/models/configs/MemoryConfig.js` — parse + expose `dataStoreInterval` /
  `dataStorePageSize`; validate `interval`; JSDoc.
- `source/lib/exceptions/config/InvalidMemoryDataStore.js` — new exception, mirrors
  `InvalidMemoryThresholds`.
- `source/spec/lib/models/configs/MemoryConfig_spec.js` — extend `describe('data_store')`.
- `source/spec/lib/exceptions/config/InvalidMemoryDataStore_spec.js` — new, mirroring the
  `InvalidMemoryThresholds` spec if one exists (message + fields).
