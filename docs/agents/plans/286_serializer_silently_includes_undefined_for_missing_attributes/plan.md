# Plan: Serializer silently includes undefined for missing attributes

## Overview

Add an `attr in data` guard inside `Serializer#serialize()` so that a missing attribute throws an explicit error immediately instead of silently producing `undefined`. Add a corresponding test in `Serializer_spec.js`.

## Context

`Serializer#serialize()` builds each tuple as `[attr, data[attr]]` with no validation. When `attr` is absent from the object, `data[attr]` is `undefined`, which becomes `null` in JSON. There is no indication that the serializer is misconfigured, making the defect invisible until a client notices incorrect data.

## Implementation Steps

### Step 1 — Add a missing-attribute guard in `Serializer#serialize()`

Replace the current `map` with one that checks `attr in data` before returning the tuple:

```js
return Object.fromEntries(
  this.#attributes.map((attr) => {
    if (!(attr in data)) {
      throw new Error(`Serializer: attribute "${attr}" is not present in the data`);
    }
    return [attr, data[attr]];
  })
);
```

### Step 2 — Add tests to `Serializer_spec.js`

Add a `describe` block for the missing-attribute case, covering both a single object and an array:

```js
describe('when a configured attribute is missing from the object', () => {
  it('throws an error identifying the missing attribute', () => {
    expect(() => serializer.serialize({ id: 1 }))
      .toThrowError('Serializer: attribute "name" is not present in the data');
  });
});

describe('when a configured attribute is missing from an array item', () => {
  it('throws an error for the first item with a missing attribute', () => {
    expect(() => serializer.serialize([{ id: 1, name: 'Books' }, { id: 2 }]))
      .toThrowError('Serializer: attribute "name" is not present in the data');
  });
});
```

## Files to Change

- `dev/app/lib/Serializer.js` — add `attr in data` guard in `serialize()` (lines 25–27)
- `dev/app/spec/lib/Serializer_spec.js` — add tests for missing-attribute error

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/app`: `yarn test` (CircleCI job: `jasmine-dev`)
- `dev/app`: `yarn lint` (CircleCI job: `checks-dev`)

## Notes

- The check uses `attr in data` (not `data[attr] !== undefined`) so that explicitly-set `undefined` values are distinguished from truly absent keys.
- All existing tests pass unchanged since they always supply all configured attributes.
