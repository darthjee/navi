# Issue: dev/app: DataNavigator hard-codes 'id' as the lookup field for array items

## Description

`DataNavigator#navigate()` in `dev/app/lib/DataNavigator.js` hard-codes `item.id` when looking up numeric steps in an array. This couples the navigator to a specific data schema and makes it unusable for data structures that use a different identifier field.

## Problem

- `current.find((item) => item.id === step)` always uses `id`, regardless of the actual key used in the data.
- Any data set with a non-`id` primary key (e.g. `_id`, `uuid`, `key`) silently returns `null`.
- The class cannot be reused for other endpoints or data shapes without modifying its internals.

## Expected Behavior

- The identifier field used for array lookups should be configurable.
- The default should remain `'id'` to preserve existing behaviour.
- Callers that need a different field can pass it as a constructor option.

## Solution

Accept an `idField` constructor option with a default of `'id'`:

```js
constructor(data, steps, idField = 'id') {
  this.#data    = data;
  this.#steps   = steps;
  this.#idField = idField;
}

navigate() {
  let current = this.#data;
  for (const step of this.#steps) {
    if (current == null) return null;
    current = typeof step === 'number'
      ? current.find((item) => item[this.#idField] === step)
      : current[step];
  }
  return current ?? null;
}
```

- Update `DataNavigator_spec.js` to add a test covering a non-default `idField`.
- `RequestHandler` does not need to change since it uses the default.

## Benefits

- Decouples the navigator from a specific data schema.
- Makes the class reusable for any data shape without modifying production code.
- Existing behaviour is preserved through the default value.

## Affected Files

- `dev/app/lib/DataNavigator.js`
- `dev/app/spec/lib/DataNavigator_spec.js`

---
See issue for details: https://github.com/darthjee/navi/issues/284
