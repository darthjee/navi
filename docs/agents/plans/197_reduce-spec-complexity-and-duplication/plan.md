# Plan: Reduce complexity and duplication in spec files

## Overview

Several spec files have grown repetitive or overly verbose. This plan refactors them one by one
to reduce duplication and improve readability, without changing any tested behaviour.
All changes are in test files only — no production code is touched.

## Context

Target files:
- `source/spec/utils/BaseLogger_spec.js` — 5 near-identical level blocks
- `source/spec/utils/SortedCollection_spec.js` — duplicated `beforeEach` across 5 `describe` blocks
- `source/spec/services/Engine_spec.js` — repeated `enqueue` calls
- `source/spec/services/ConfigLoader_spec.js` — duplicated `expectedResources` across two `describe` blocks
- `dev/app/spec/app_spec.js` + `Router_spec.js` — same 4 routes tested at two levels with repeated assertions
- `dev/app/spec/lib/RouteRegister_spec.js` + `RequestHandler_spec.js` — identical expected response payloads repeated inline

---

## Implementation Steps

### Step 1 — `BaseLogger_spec.js`: data-driven level matrix

Replace the 5 `describe` blocks (one per log level) with a single data-driven loop.

Define a level matrix:
```js
const levelMatrix = [
  ['debug',  { debug: true,  info: true,  warn: true,  error: true  }],
  ['info',   { debug: false, info: true,  warn: true,  error: true  }],
  ['warn',   { debug: false, info: false, warn: true,  error: true  }],
  ['error',  { debug: false, info: false, warn: false, error: true  }],
  ['silent', { debug: false, info: false, warn: false, error: false }],
];
```

Then iterate with `levelMatrix.forEach(([level, expected]) => { describe(...) { ... } })`,
generating one `it` per method per level using `expected[method]` to branch between
`toHaveBeenCalledWith` and `not.toHaveBeenCalled`.

Keep the `#suppress`, `#setLevel`, and `with LOG_LEVEL env var` blocks unchanged — they are not repetitive.

### Step 2 — `SortedCollection_spec.js`: hoist shared `beforeEach`

The five `describe` blocks for `#select`, `#after`, `#from`, `#before`, and `#upTo` each have
an identical `beforeEach` that creates a 4-element collection. Wrap them in a shared inner
`describe('with a 4-element collection', ...)` and move the `beforeEach` there:

```js
describe('with a 4-element collection', () => {
  beforeEach(() => {
    collection = new SortedCollection(
      [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
      { sortBy }
    );
  });

  describe('#select', () => { ... });
  describe('#after',  () => { ... });
  describe('#from',   () => { ... });
  describe('#before', () => { ... });
  describe('#upTo',   () => { ... });
});
```

The `#push` and `#list` blocks use an empty collection and are not affected.

### Step 3 — `Engine_spec.js`: extract `enqueueJobs` helper

Extract a local helper at the top of the outer `describe`:

```js
const enqueueJobs = (n) => {
  for (let i = 0; i < n; i++) {
    jobRegistry.enqueue({ resourceRequest: {}, parameters: {} });
  }
};
```

Replace all inline repetitions of `jobRegistry.enqueue(...)` calls with `enqueueJobs(n)`.

### Step 4 — `ConfigLoader_spec.js`: hoist shared `expectedResources`

Both `describe` blocks assign the same value to `expectedResources`:
```js
expectedResources = { categories: ResourceFactory.build() };
```

Move this to the outer `beforeEach` (it is already the outer `describe`'s `beforeEach` context
since there is no outer `beforeEach` yet — add one). Each inner `describe` keeps only the parts
that differ (`expectedClients` and `expectedWorkersConfig`).

### Step 5 — `dev/app/spec/`: extract shared expected response constants

`Router_spec.js`, `RouteRegister_spec.js`, and `RequestHandler_spec.js` all assert the same
literal response payloads inline:

```js
{ id: 1, name: 'The Hobbit' }   // item
{ id: 1, name: 'Books' }        // category
[{ id: 1, name: 'Books' }, ...] // categories list
```

Extract these to a shared support file `dev/app/spec/support/fixtures/expectedResponses.js`:

```js
export const BOOKS_CATEGORY   = { id: 1, name: 'Books' };
export const HOBBIT_ITEM      = { id: 1, name: 'The Hobbit' };
export const ALL_CATEGORIES   = [
  { id: 1, name: 'Books' },
  { id: 2, name: 'Movies' },
  { id: 3, name: 'Music' },
];
```

Import and use these constants in the three spec files.

The `buildTestApp` helpers in `RouteRegister_spec.js` and `RequestHandler_spec.js` have different
signatures and responsibilities — they stay in their respective files.

### Step 6 — `dev/app/spec/app_spec.js` vs `Router_spec.js`: document the boundary

These two files intentionally test different levels:
- `app_spec.js` — integration test of the full app (including 404 middleware), uses loose assertions (`toBeGreaterThan(0)`)
- `Router_spec.js` — unit test of `Router` in isolation, uses exact body equality

Add a short comment at the top of each file clarifying the scope. No structural change needed.

---

## Files to Change

- `source/spec/utils/BaseLogger_spec.js` — replace 5 level-describe blocks with a data-driven loop
- `source/spec/utils/SortedCollection_spec.js` — wrap 5 filter-method describes in a shared parent with one `beforeEach`
- `source/spec/services/Engine_spec.js` — extract `enqueueJobs(n)` helper
- `source/spec/services/ConfigLoader_spec.js` — hoist shared `expectedResources` to outer `beforeEach`
- `dev/app/spec/support/fixtures/expectedResponses.js` — new file with shared response constants
- `dev/app/spec/lib/Router_spec.js` — import and use shared constants; add scope comment
- `dev/app/spec/lib/RouteRegister_spec.js` — import and use shared constants
- `dev/app/spec/lib/RequestHandler_spec.js` — import and use shared constants
- `dev/app/spec/app_spec.js` — add scope comment

## CI Checks

Before opening a PR, run the following checks for the folders being modified:
- `source/`: `cd source; yarn test` and `cd source; yarn lint` (CircleCI jobs: `jasmine`, `checks`)
- `dev/app/`: `cd dev/app; yarn test` and `cd dev/app; yarn lint` (CircleCI jobs: `jasmine-dev`, `checks-dev`)

## Notes

- The `BaseLogger_spec.js` matrix approach will reduce the file from ~214 lines to roughly ~60–70 lines.
- The `SortedCollection_spec.js` wrapping adds one level of nesting but removes ~20 lines of repeated setup.
- No production code is changed — all changes are in spec and support files.
- JSCPD should show improvement or no regression after these changes.
