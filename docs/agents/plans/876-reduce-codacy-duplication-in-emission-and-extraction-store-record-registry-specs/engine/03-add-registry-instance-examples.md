# Add RegistryInstanceExamples

Create `source/spec/support/utils/RegistryInstanceExamples.js` with the scenarios shared by `EmissionRegistryInstance` and `ExtractionRegistryInstance`:

- constructor: `store` is an instance of the store class (`` `creates an ${storeName}` ``), default store retention is 100, a custom `{ retention: 25 }` is forwarded to the store
- `#getRecords` (called inside the caller's `describe` whose `beforeEach` adds records keyed `a`, `b`, `c`): all records oldest-first, `lastId` filter, unknown `lastId` returns an empty array
- `#getRecordById`: returns the matching record, `undefined` for an unknown id

Parameters: the instance getter, the instance class, the store class and its name, an `addRecord(instance, key)` callback returning the record, and `keyField` (`itemRef` / `originUrl`).

Then refactor `EmissionRegistryInstance_spec.js` and `ExtractionRegistryInstance_spec.js` to call the helpers, keeping `#recordEmission` / `#recordExtraction`, `#incExtracted`, `#counts` and `#clear` inline.

## Files to Change
- `source/spec/support/utils/RegistryInstanceExamples.js` — new shared examples for the RegistryInstance specs
- `source/spec/lib/registry/instances/EmissionRegistryInstance_spec.js` — call the shared examples, keep emission-specific scenarios
- `source/spec/lib/registry/instances/ExtractionRegistryInstance_spec.js` — call the shared examples, keep extraction-specific scenarios
