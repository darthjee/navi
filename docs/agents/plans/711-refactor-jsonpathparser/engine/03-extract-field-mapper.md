# Extract FieldMapper

Create `FieldMapper`, encapsulating `JsonPathParser`'s current `#mapFields` private method. Constructor receives `fields` (the `{ sourceKey: outputKey }` mapping) and stores it. Method `map(item)` builds and returns a new object mapping `sourceKey → outputKey`, same `Object.entries(fields).reduce(...)` logic as today.

Add a spec covering: a single-field mapping, a multi-field mapping, and a mapping where a source key is absent from `item` (maps to `undefined`, matching current behavior).

## Files to Change
- `source/lib/parsers/json_path/FieldMapper.js` — new class; constructor(fields), method map(item).
- `source/spec/lib/parsers/json_path/FieldMapper_spec.js` — new spec for the class above.
