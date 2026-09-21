# Add RecordExamples

Create `source/spec/support/utils/RecordExamples.js` with the scenarios shared by `EmissionRecord` and `ExtractionRecord`:

- constructor: `creates a record with the given id` and `creates a record with a timestamp` (`Date` instance)
- `#timestamp`: the timestamp is created at construction time (before/after window). It needs a callback building a fresh minimal record, e.g. `buildRecord(id)`
- `#toJSON`: `id` and the timestamp as an ISO string

Parameters: a record getter (built in the caller's `beforeEach`), the expected id, and the `buildRecord` callback. Per-field scenarios (`status`, `url`, `parserType`, `originUrl`, ...) and the "when optional fields are omitted" defaults stay in the spec files, since they differ per class.

Then refactor `EmissionRecord_spec.js` and `ExtractionRecord_spec.js` to call the helpers.

## Files to Change
- `source/spec/support/utils/RecordExamples.js` — new shared examples for the Record specs
- `source/spec/lib/utils/emissions/EmissionRecord_spec.js` — call the shared examples, keep emission-specific scenarios
- `source/spec/lib/utils/extractions/ExtractionRecord_spec.js` — call the shared examples, keep extraction-specific scenarios
