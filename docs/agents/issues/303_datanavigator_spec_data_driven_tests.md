# Issue: dev/app/spec: DataNavigator_spec uses manual repetitive patterns instead of data-driven tests

## Description

`dev/app/spec/lib/DataNavigator_spec.js` has 8 separate `it` blocks across 4 `describe` blocks, each following the same pattern: construct a `DataNavigator`, call `navigate()`, and compare the result. The only variation between cases is the `steps` array and the expected value, yet each case is written out fully by hand.

## Problem

- Adding a new test case requires copying an entire `describe`/`it` block.
- The boilerplate obscures the actual variation between cases.
- 8 manually written tests could be expressed as a compact table of `[steps, expected]` pairs.

## Expected Behavior

- The repetitive cases should be consolidated into a data-driven loop over a table of `{ steps, expected }` pairs.
- The custom-`idField` tests should remain as a separate block since they use different data.

## Solution

Consolidate the repetitive cases using a data-driven loop:

```js
const cases = [
  { steps: ['categories'],           expected: () => data.categories    },
  { steps: ['unknown'],              expected: () => null                },
  { steps: ['categories', 1],        expected: () => data.categories[0] },
  { steps: ['categories', 999],      expected: () => null                },
  // ...
];

cases.forEach(({ steps, expected }) => {
  it(`navigate(${JSON.stringify(steps)}) returns expected value`, () => {
    expect(new DataNavigator(data, steps).navigate()).toEqual(expected());
  });
});
```

Keep the custom-`idField` tests as a separate `describe` block since they use different data.

## Benefits

- Reduces boilerplate and makes the variation between cases immediately visible.
- Adding a new test case becomes a single line in the table.
- Easier to scan and maintain.

## Affected Files

- `dev/app/spec/lib/DataNavigator_spec.js`

---
See issue for details: https://github.com/darthjee/navi/issues/303
