# Issue: dev/app/spec — routes.config_spec tests by array index instead of route pattern

## Description

`spec/lib/routes.config_spec.js` asserts on the content of `ROUTES` by hard-coded array index. This couples the tests to the current registration order, making them brittle: any reordering of routes causes failures even though the behaviour is unchanged.

## Problem

- Tests use `ROUTES[0]`, `ROUTES[1]`, etc. to look up individual route definitions
- If a route is reordered, every indexed test breaks regardless of whether the actual behaviour changed
- Tests verify implementation order rather than the contract (which routes exist and with which attributes)

## Expected Behavior

- Each route is looked up by its `route` field, not by its position in the array
- A separate test guards against accidentally added or removed routes by asserting the total length
- Reordering routes does not break any tests

## Solution

- Replace each index-based lookup with a `ROUTES.find(r => r.route === '...')` lookup:
  ```js
  const entry = ROUTES.find(r => r.route === '/categories.json');
  expect(entry).toEqual({ route: '/categories.json', attributes: ['id', 'name'] });
  ```
- Keep one test that asserts the total number of routes to prevent silent additions or removals

## Benefits

- Tests verify behaviour (which routes are defined) rather than implementation order
- Route reordering becomes safe and non-breaking
- Intent of each test is clearer — the route pattern is visible in the lookup

## Affected Files

- `dev/app/spec/lib/routes.config_spec.js`

---
See issue for details: https://github.com/darthjee/navi/issues/300
