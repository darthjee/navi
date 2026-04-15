# Issue: RouteParamsExtractor fails silently on malformed route patterns

## Description

`RouteParamsExtractor` accepts any string as a route pattern without validating its syntax. Malformed patterns (e.g. a route not starting with `/`, an empty string, or a `:` segment with no parameter name) are not caught at construction time and may produce incorrect steps or confusing errors at runtime with no indication of which pattern is at fault.

## Problem

- No validation is performed on the `route` argument in the constructor.
- A route that does not start with `/` silently produces wrong steps.
- A `:` segment with no name (e.g. `/:`) silently produces an empty parameter name.
- Errors surface deep in `DataNavigator` or as `NaN`-related issues, far from the root cause.
- The offending pattern is not included in any error message.

## Expected Behavior

- If the route pattern is not a non-empty string starting with `/`, an error should be thrown at construction time identifying the invalid pattern.
- If a `:` segment has an empty parameter name, an error should be thrown identifying the pattern.

## Solution

Add validation in the constructor:

```js
constructor(route, params) {
  if (typeof route !== 'string' || !route.startsWith('/')) {
    throw new Error(`RouteParamsExtractor: invalid route pattern "${route}" — must start with "/"`);
  }
  this.#route = route;
  this.#params = params;
}
```

And in `steps()`, validate empty param names:

```js
if (segment.startsWith(':')) {
  const paramName = segment.slice(1);
  if (!paramName) {
    throw new Error(`RouteParamsExtractor: empty parameter name in route "${this.#route}"`);
  }
  // existing numeric validation...
}
```

- Add corresponding tests in `RouteParamsExtractor_spec.js` for each invalid-pattern scenario.

## Benefits

- Malformed route configurations are caught immediately, not at request time.
- Error messages identify the exact pattern that caused the failure.
- Debugging misconfigured routes is significantly faster.

## Affected Files

- `dev/app/lib/RouteParamsExtractor.js`
- `dev/app/spec/lib/RouteParamsExtractor_spec.js`

---
See issue for details: https://github.com/darthjee/navi/issues/287
