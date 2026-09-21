# Add StoreExamples

Record the baseline first: run `yarn test` in `source/` and note the reported spec count.

Create `source/spec/support/utils/StoreExamples.js`, a static class in the style of `JobLifecycleExamples`, with one method per shared Store scenario group (granularity is up to the implementer, but each method must be callable inside the caller's own `describe` so the describe hierarchy is preserved):

- constructor examples: empty store, default retention 100, custom retention 50
- retention-limit examples (called inside the caller's `describe('when retention limit is reached')`, whose `beforeEach` fills a store of size 3): size does not exceed the limit, oldest record removed, newest record kept
- `#getRecords`, `#getRecordById`, `#size`, `#retention` examples
- `#clear` examples: removes all records, empty `getRecords` (the caller keeps its own `beforeEach` populating and clearing the store, and its own counter-reset spec)
- `#counts` copy example: mutating the returned object does not affect the store (parameterised by the counter key, `emitted` vs `extracted`)
- `#toJSON` example: records returned oldest-first with a string timestamp

Parameters (as getters/callbacks): the store getter, a factory building a store with a given retention (`new EmissionStore(n)`), an `addRecord(store, key)` callback returning the created record, and `keyField` (`itemRef` / `originUrl`).

Then refactor `EmissionStore_spec.js` and `ExtractionStore_spec.js` to call these helpers, keeping the class-specific scenarios inline (see the Context section of [engine.md](../engine.md)).

## Files to Change
- `source/spec/support/utils/StoreExamples.js` — new shared examples for the Store specs
- `source/spec/lib/utils/emissions/EmissionStore_spec.js` — call the shared examples, keep emission-specific scenarios
- `source/spec/lib/utils/extractions/ExtractionStore_spec.js` — call the shared examples, keep extraction-specific scenarios
