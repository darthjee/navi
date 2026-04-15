# Plan: dev/app/spec — routes.config_spec tests by array index instead of route pattern

## Overview

Replace hard-coded array index lookups in `routes.config_spec.js` with pattern-based lookups using `Array#find`, and add a single length assertion to guard against silent additions or removals.

## Context

`spec/lib/routes.config_spec.js` currently asserts on `ROUTES` entries by position (`ROUTES[0]`, `ROUTES[1]`, etc.). This makes the tests brittle: any reordering of `ROUTES` causes every indexed test to fail even though the behaviour (which routes exist with which attributes) is unchanged. Tests should verify the contract, not the implementation order.

## Implementation Steps

### Step 1 — Read the current spec file

Read `dev/app/spec/lib/routes.config_spec.js` to inventory every index-based assertion and understand the full current structure.

### Step 2 — Replace index lookups with pattern-based lookups

For each `expect(ROUTES[n]).toEqual(...)` assertion, replace it with:

```js
const entry = ROUTES.find(r => r.route === '<route-pattern>');
expect(entry).toEqual({ route: '<route-pattern>', ... });
```

The route pattern to look up is already present in the expected object, so no information is lost.

### Step 3 — Add a total-length guard

Add (or keep, if already present) one test that asserts the total number of entries in `ROUTES`:

```js
it('defines the expected number of routes', () => {
  expect(ROUTES.length).toBe(<n>);
});
```

This prevents silent additions or removals from going undetected.

### Step 4 — Verify

Run `yarn lint` and `yarn test` inside `dev/app/` (via Docker) to confirm all tests pass and no linting errors are introduced.

## Files to Change

- `dev/app/spec/lib/routes.config_spec.js` — replace index lookups with `find` lookups; ensure a length guard test exists

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/app/`: `docker-compose run --rm navi_dev_app yarn test` (CircleCI job: `jasmine-dev`)
- `dev/app/`: `docker-compose run --rm navi_dev_app yarn lint` (CircleCI job: `checks-dev`)

## Notes

- No production code changes — this is a test-only refactor.
- The number of routes for the length guard should be read from the current spec/source before writing.
- If a `ROUTES.length` test already exists, keep it as-is; otherwise add it.
