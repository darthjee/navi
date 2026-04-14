# Issue: Serializer silently includes undefined for missing attributes

## Description

In `dev/app/lib/Serializer.js`, when an attribute in the allowlist is not present in the data object, `data[attr]` returns `undefined` and is silently included in the serialized output. There is no warning or error, making misconfigured serializers and missing data hard to detect.

## Problem

- `this.#attributes.map((attr) => [attr, data[attr]])` produces `[attr, undefined]` tuples for missing keys.
- `Object.fromEntries` then includes `{ attr: undefined }` in the output.
- Clients may receive keys with `undefined` values (serialized as `null` in JSON).
- Bugs caused by missing attributes are hard to trace: no error is raised, and tests may pass even when attributes are misconfigured.

## Expected Behavior

- When a configured attribute is absent from the data, the serializer should detect this and either:
  - throw an error identifying which attribute is missing, or
  - log a warning and omit the key from the output.
- The behavior should be explicit rather than silently propagating `undefined`.

## Solution

Validate each attribute before including it in the output:

```js
return Object.fromEntries(
  this.#attributes
    .filter((attr) => {
      if (!(attr in data)) {
        throw new Error(`Serializer: attribute "${attr}" is not present in the data`);
      }
      return true;
    })
    .map((attr) => [attr, data[attr]])
);
```

Or equivalently, raise inside the `map`:

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

- Add a corresponding test case in `Serializer_spec.js` for the missing-attribute scenario.

## Benefits

- Fail fast: misconfigured serializers are caught immediately rather than silently producing wrong output.
- Easier debugging: the error message identifies the exact attribute that is missing.
- Tests that pass with a misconfigured serializer will now correctly fail.

## Affected Files

- `dev/app/lib/Serializer.js` (lines 25–27)
- `dev/app/spec/lib/Serializer_spec.js`

---
See issue for details: https://github.com/darthjee/navi/issues/286
