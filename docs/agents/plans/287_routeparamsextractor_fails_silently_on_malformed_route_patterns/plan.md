# Plan: RouteParamsExtractor fails silently on malformed route patterns

## Overview

Add constructor-time validation to `RouteParamsExtractor` to reject route patterns that do not start with `/`, and add a guard in `steps()` to reject `:` segments with an empty parameter name. Add corresponding tests for each invalid-pattern scenario.

## Context

`RouteParamsExtractor` currently accepts any value as a route pattern with no checks. A pattern not starting with `/` silently produces wrong steps; a bare `:` segment produces an empty param name and a confusing downstream error. Both failures surface far from their root cause. Validating at construction time (or as early as possible in `steps()`) gives immediate, actionable feedback.

## Implementation Steps

### Step 1 — Validate the route pattern in the constructor

Add a check that `route` is a non-empty string starting with `/`:

```js
constructor(route, params) {
  if (typeof route !== 'string' || !route.startsWith('/')) {
    throw new Error(`RouteParamsExtractor: invalid route pattern "${route}" — must start with "/"`);
  }
  this.#route = route;
  this.#params = params;
}
```

### Step 2 — Validate empty parameter names in `steps()`

Inside the existing `if (segment.startsWith(':'))` block, add a guard before the numeric check:

```js
if (segment.startsWith(':')) {
  const paramName = segment.slice(1);
  if (!paramName) {
    throw new Error(`RouteParamsExtractor: empty parameter name in route "${this.#route}"`);
  }
  const numValue = Number(this.#params[paramName]);
  if (isNaN(numValue)) {
    throw new Error(`Invalid numeric parameter "${paramName}": ${this.#params[paramName]}`);
  }
  return numValue;
}
```

### Step 3 — Add tests to `RouteParamsExtractor_spec.js`

Add a top-level `describe` block for constructor validation (outside `#steps`) and a new `describe` block inside `#steps` for the empty-param-name case:

```js
describe('constructor', () => {
  describe('when the route does not start with "/"', () => {
    it('throws an error identifying the invalid pattern', () => {
      expect(() => new RouteParamsExtractor('categories.json', {}))
        .toThrowError('RouteParamsExtractor: invalid route pattern "categories.json" — must start with "/"');
    });
  });

  describe('when the route is an empty string', () => {
    it('throws an error', () => {
      expect(() => new RouteParamsExtractor('', {}))
        .toThrowError('RouteParamsExtractor: invalid route pattern "" — must start with "/"');
    });
  });
});

// inside describe('#steps'):
describe('with an empty parameter name', () => {
  it('throws an error identifying the route', () => {
    const extractor = new RouteParamsExtractor('/categories/:.json', {});
    expect(() => extractor.steps())
      .toThrowError('RouteParamsExtractor: empty parameter name in route "/categories/:.json"');
  });
});
```

## Files to Change

- `dev/app/lib/RouteParamsExtractor.js` — add constructor validation + empty-param-name guard in `steps()`
- `dev/app/spec/lib/RouteParamsExtractor_spec.js` — add tests for invalid route and empty param name

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/app`: `yarn test` (CircleCI job: `jasmine-dev`)
- `dev/app`: `yarn lint` (CircleCI job: `checks-dev`)

## Notes

- The constructor check uses `route.startsWith('/')` which also covers `null`/`undefined` (they are not strings, so `typeof route !== 'string'` catches them first).
- All existing tests pass unchanged since every valid route begins with `/`.
