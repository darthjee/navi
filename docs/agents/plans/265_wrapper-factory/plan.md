# Plan: Introduce a test factory for wrapper objects

## Overview

Create `WrapperFactory.js` in `source/spec/support/factories/` following the existing factory
conventions. Replace all inline wrapper-object constructions in three spec files with calls to
`WrapperFactory.build(overrides)`.

## Context

`ParametersMapper_spec.js`, `PathResolver_spec.js`, and `PathSegmentTraverser_spec.js` each define
plain wrapper objects inline, repeated 4–6 times per file:

```js
const wrapper = {
  parsedBody: { id: 1, name: 'Electronics', kind_id: 42 },
  headers: { page: '3' },
};
```

The existing factory convention (e.g. `ResourceRequestFactory`, `ResourceFactory`) is a class with
a single `static build(overrides = {})` method that merges caller-supplied values over sensible
defaults and returns the object.

## Implementation Steps

### Step 1 — Create `WrapperFactory.js`

Create `source/spec/support/factories/WrapperFactory.js`:

```js
/**
 * Factory for creating plain wrapper objects in tests.
 * Simulates the shape of ResponseWrapper (parsedBody + headers).
 */
class WrapperFactory {
  /**
   * Builds a wrapper object.
   * @param {object} [params={}] - Optional attributes.
   * @param {object} [params.parsedBody={ id: 1 }] - The parsed response body.
   * @param {object} [params.headers={}] - The response headers.
   * @param {object} [params.parameters] - Optional parameters carried by the item.
   * @returns {object} A plain wrapper object.
   */
  static build({ parsedBody = { id: 1 }, headers = {}, parameters = undefined } = {}) {
    const wrapper = { parsedBody, headers };
    if (parameters !== undefined) wrapper.parameters = parameters;
    return wrapper;
  }
}

export { WrapperFactory };
```

Defaults chosen as the minimal denominator across the three files:
- `parsedBody: { id: 1 }` — appears in `PathResolver_spec.js` and `ParametersMapper_spec.js` as the base case for error/missing-field tests.
- `headers: {}` — empty headers is the most common "I don't care about headers" value.
- `parameters` is optional and only added when explicitly provided (used by one test in `ParametersMapper_spec.js`).

### Step 2 — Update `ParametersMapper_spec.js`

Import `WrapperFactory` and replace the 6 inline `const wrapper = { ... }` blocks:

| Lines | Current inline object | Factory call |
|-------|-----------------------|--------------|
| 47–50 | `parsedBody: { id: 1, name: 'Electronics', kind_id: 42 }, headers: { page: '3' }` | `WrapperFactory.build({ parsedBody: { id: 1, name: 'Electronics', kind_id: 42 }, headers: { page: '3' } })` |
| 67–70 | `parsedBody: { id: 1 }, headers: { page: '3', 'x-total': '100' }` | `WrapperFactory.build({ headers: { page: '3', 'x-total': '100' } })` |
| 84–87 | `parsedBody: { id: 1 }, headers: { page: '3' }` | `WrapperFactory.build({ headers: { page: '3' } })` |
| 99–103 | `parsedBody: { id: 5 }, headers: {}, parameters: { category_id: 3 }` | `WrapperFactory.build({ parsedBody: { id: 5 }, parameters: { category_id: 3 } })` |
| 120–123 | `parsedBody: { id: 1 }, headers: {}` | `WrapperFactory.build()` |
| 142–145 | `parsedBody: { user: { address: { city: 'Paris' } } }, headers: {}` | `WrapperFactory.build({ parsedBody: { user: { address: { city: 'Paris' } } } })` |

### Step 3 — Update `PathResolver_spec.js`

Import `WrapperFactory` and replace the 4 inline wrapper blocks:

| Lines | Current inline object | Factory call |
|-------|-----------------------|--------------|
| 14–17 | `parsedBody: { id: 1, name: 'Electronics', kind_id: 42 }, headers: { page: '3' }` | `WrapperFactory.build({ parsedBody: { id: 1, name: 'Electronics', kind_id: 42 }, headers: { page: '3' } })` |
| 31–34 | `parsedBody: { id: 1 }, headers: { page: '3', 'x-total': '100' }` | `WrapperFactory.build({ headers: { page: '3', 'x-total': '100' } })` |
| 48–51 | `parsedBody: { user: { address: { city: 'Paris' } } }, headers: {}` | `WrapperFactory.build({ parsedBody: { user: { address: { city: 'Paris' } } } })` |
| 60–63 | `parsedBody: { id: 1 }, headers: {}` | `WrapperFactory.build()` |

### Step 4 — Update `PathSegmentTraverser_spec.js`

`PathSegmentTraverser` receives any plain object (not necessarily a `ResponseWrapper`), but its
test objects share the same `{ parsedBody, headers }` shape. Replace the applicable inline objects:

| Lines | Current inline object | Factory call |
|-------|-----------------------|--------------|
| 7–10 | `parsedBody: { id: 1, nested: { key: 'val' } }, headers: { page: '3' }` | `WrapperFactory.build({ parsedBody: { id: 1, nested: { key: 'val' } }, headers: { page: '3' } })` |
| 28 | `{ parsedBody: { id: 1 } }` | `WrapperFactory.build()` — defaults give `{ parsedBody: { id: 1 }, headers: {} }`, which is equivalent since only `parsedBody` is traversed in this test |
| 42 | `{ parsedBody: null }` | `WrapperFactory.build({ parsedBody: null })` |
| 55 | `{ parsedBody: { id: 1 }, headers: {} }` | `WrapperFactory.build()` |

> Note: The object at line 28 lacks a `headers` key entirely. `WrapperFactory.build()` adds
> `headers: {}`, which does not affect the test (only `parsedBody` is traversed). This is safe.

## Files to Change

- `source/spec/support/factories/WrapperFactory.js` — **create**: new factory class
- `source/spec/lib/models/ParametersMapper_spec.js` — add import, replace 6 inline wrapper objects
- `source/spec/lib/models/PathResolver_spec.js` — add import, replace 4 inline wrapper objects
- `source/spec/lib/models/PathSegmentTraverser_spec.js` — add import, replace 4 inline objects

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `yarn test` (CircleCI job: `jasmine`)
- `source/`: `yarn lint` (CircleCI job: `checks`)
- `source/`: `yarn report` (CircleCI job: `checks` — JSCPD duplication report)

## Notes

- No production code changes — this is purely a test-support refactor.
- `WrapperFactory` does **not** instantiate `ResponseWrapper` (the real model class). It creates
  plain JS objects with the same shape. This matches existing test practice and avoids coupling
  the factory to the `ResponseWrapper` constructor signature.
- The `parameters` optional key is only added to the returned object when explicitly provided,
  preserving test isolation for cases that assert on the absence of that key.
