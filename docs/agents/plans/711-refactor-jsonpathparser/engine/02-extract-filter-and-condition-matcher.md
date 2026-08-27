# Extract FilterMatcher and ConditionMatcher

Create `ConditionMatcher`, encapsulating `JsonPathParser`'s current `#matchesCondition` private method. Constructor receives the condition object `{ field, equals, equals_field }`. Method `matches(item)` returns `item[field] === item[equalsField]` when `equals_field` is present, otherwise `item[field] === equals` — same logic as today.

Create `FilterMatcher`, encapsulating `JsonPathParser`'s current `#matchesFilter` private method. Constructor receives `filter` (the array of conditions, or `undefined`). Method `matches(item)` returns `true` when `filter` is absent; otherwise ANDs every condition, instantiating `new ConditionMatcher(condition)` internally for each one (no dependency injection) and calling its `matches(item)`.

Add specs for both classes:
- `ConditionMatcher_spec.js`: an `equals` match/mismatch, and an `equals_field` match/mismatch.
- `FilterMatcher_spec.js`: `filter` absent (always matches), a single passing condition, a single failing condition, and multiple conditions where all must pass (AND semantics).

## Files to Change
- `source/lib/parsers/json_path/ConditionMatcher.js` — new class; constructor(condition), method matches(item).
- `source/lib/parsers/json_path/FilterMatcher.js` — new class; constructor(filter), method matches(item), instantiates `ConditionMatcher` internally.
- `source/spec/lib/parsers/json_path/ConditionMatcher_spec.js` — new spec.
- `source/spec/lib/parsers/json_path/FilterMatcher_spec.js` — new spec.
