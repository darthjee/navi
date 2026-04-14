# Issue: dev/app: RouteParamsExtractor silently converts invalid params to NaN

## Description

`RouteParamsExtractor#steps()` in `dev/app/lib/RouteParamsExtractor.js` uses `Number(this.#params[segment.slice(1)])` without validation. When a URL param is non-numeric (e.g. `/categories/abc.json`), `Number('abc')` returns `NaN`, which silently propagates into `DataNavigator` and produces a 404 with no indication that the parameter was malformed.

## Problem

- Non-numeric URL parameters are converted to `NaN` with no error or warning.
- `NaN` propagates into `DataNavigator`, causing a silent 404 that is indistinguishable from a legitimate "not found" response.
- The API gives no feedback to clients about what went wrong.
- Debugging malformed requests is very difficult.

## Expected Behavior

- If a route parameter that is expected to be numeric receives a non-numeric value, an explicit error should be thrown immediately in `RouteParamsExtractor#steps()`.
- The error should identify both the parameter name and the invalid value.

## Solution

Validate the parameter before converting:

```js
if (segment.startsWith(':')) {
  const paramName = segment.slice(1);
  const numValue = Number(this.#params[paramName]);
  if (isNaN(numValue)) {
    throw new Error(`Invalid numeric parameter "${paramName}": ${this.#params[paramName]}`);
  }
  return numValue;
}
```

- Add a corresponding test case in `RouteParamsExtractor_spec.js` for the non-numeric input scenario.
- Optionally, handle the error in `RequestHandler` to return a 400 response instead of a 404.

## Benefits

- Fail fast with a clear error instead of silently producing a wrong result.
- Easier debugging: the error message identifies the exact parameter and value that caused the failure.
- Better API behaviour: clients receive a meaningful error rather than a generic 404.

## Affected Files

- `dev/app/lib/RouteParamsExtractor.js`

---
See issue for details: https://github.com/darthjee/navi/issues/283
