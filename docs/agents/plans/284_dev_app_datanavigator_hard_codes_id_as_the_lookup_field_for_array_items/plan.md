# Plan: dev/app: DataNavigator hard-codes 'id' as the lookup field for array items

## Overview

Add an optional `idField` constructor parameter to `DataNavigator` (defaulting to `'id'`) so that numeric steps use `item[idField]` instead of `item.id`. Update the JSDoc and add a test covering a custom `idField`. No other files need to change.

## Context

`DataNavigator#navigate()` calls `current.find((item) => item.id === step)` for every numeric step. Any data structure that uses a key other than `id` silently returns `null`. Existing callers (`RequestHandler`) always use the default, so adding the option with a default is fully backwards-compatible.

## Implementation Steps

### Step 1 — Add `idField` to `DataNavigator`

Add the private field and the constructor parameter:

```js
class DataNavigator {
  #data;
  #steps;
  #idField;

  constructor(data, steps, idField = 'id') {
    this.#data    = data;
    this.#steps   = steps;
    this.#idField = idField;
  }
```

Replace the hard-coded lookup in `navigate()`:

```js
current = current.find((item) => item[this.#idField] === step);
```

Update the JSDoc `@param` for the constructor to document the new parameter.

### Step 2 — Add a test for a custom `idField` in `DataNavigator_spec.js`

Add a `describe` block that constructs a small in-memory dataset keyed by a field other than `id` and verifies that navigation succeeds:

```js
describe('with a custom idField', () => {
  const customData = { items: [{ key: 1, name: 'one' }, { key: 2, name: 'two' }] };

  it('finds the element by the custom field', () => {
    const navigator = new DataNavigator(customData, ['items', 1], 'key');
    expect(navigator.navigate()).toBe(customData.items[0]);
  });

  it('returns null when no element matches', () => {
    const navigator = new DataNavigator(customData, ['items', 999], 'key');
    expect(navigator.navigate()).toBeNull();
  });
});
```

## Files to Change

- `dev/app/lib/DataNavigator.js` — add `#idField` private field, `idField = 'id'` constructor param, use `item[this.#idField]` in `navigate()`
- `dev/app/spec/lib/DataNavigator_spec.js` — add tests for custom `idField`

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/app`: `yarn test` (CircleCI job: `jasmine-dev`)
- `dev/app`: `yarn lint` (CircleCI job: `checks-dev`)

## Notes

- `RequestHandler` passes only `data` and `steps` to `DataNavigator`, so it is unaffected by the new parameter.
- All existing tests should pass unchanged since the default value preserves the current behaviour.
