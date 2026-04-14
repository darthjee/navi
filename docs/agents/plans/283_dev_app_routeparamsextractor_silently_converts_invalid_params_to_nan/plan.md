# Plan: dev/app: RouteParamsExtractor silently converts invalid params to NaN

## Overview

Add a `NaN` guard in `RouteParamsExtractor#steps()` so that non-numeric URL parameters throw an explicit error instead of silently producing `NaN`. Catch the error in `RequestHandler#handle()` to return a 400 response. Add corresponding tests for both.

## Context

`RouteParamsExtractor#steps()` maps `:param` segments to numbers using `Number(this.#params[paramName])`. When the param is non-numeric (e.g. `/categories/abc.json`), this silently returns `NaN`, which propagates into `DataNavigator` and produces a 404 indistinguishable from a legitimate "not found" result.

## Implementation Steps

### Step 1 — Guard against NaN in `RouteParamsExtractor#steps()`

After computing `Number(...)`, check `isNaN` and throw if the value is invalid:

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

### Step 2 — Handle the error in `RequestHandler#handle()` with a 400 response

Wrap the extraction + navigation in a try/catch so that an invalid-param error returns a 400 (Bad Request) instead of propagating as an unhandled exception (which would cause a 500):

```js
handle(req, res) {
  try {
    const steps = new RouteParamsExtractor(this.#route, req.params).steps();
    const result = new DataNavigator(this.#data, steps).navigate();
    if (result === null) return notFound(res);
    res.json(this.#serializer ? this.#serializer.serialize(result) : result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
```

### Step 3 — Add tests to `RouteParamsExtractor_spec.js`

Add a `describe` block for the non-numeric param case that verifies the error is thrown with a descriptive message:

```js
describe('with a non-numeric URL param', () => {
  it('throws an error with the param name and value', () => {
    const extractor = new RouteParamsExtractor('/categories/:id.json', { id: 'abc' });
    expect(() => extractor.steps()).toThrowError('Invalid numeric parameter "id": abc');
  });
});
```

### Step 4 — Add tests to `RequestHandler_spec.js`

Add a test that verifies a 400 is returned when a non-numeric param is given:

```js
describe('when a URL param is non-numeric', () => {
  it('returns 400', async () => {
    const res = await request(app).get('/categories/abc.json');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('"id"');
  });
});
```

## Files to Change

- `dev/app/lib/RouteParamsExtractor.js` — add `isNaN` guard before returning the numeric value
- `dev/app/lib/RequestHandler.js` — wrap extraction/navigation in try/catch, respond 400 on error
- `dev/app/spec/lib/RouteParamsExtractor_spec.js` — add test for non-numeric param
- `dev/app/spec/lib/RequestHandler_spec.js` — add test for 400 on non-numeric param

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/app`: `yarn test` (CircleCI job: `jasmine-dev`)
- `dev/app`: `yarn lint` (CircleCI job: `checks-dev`)

## Notes

- `DataNavigator` receives `NaN` as an ID and calls `Array#find(item => item.id === NaN)`, which always returns `undefined` (since `NaN !== NaN`), resulting in `null` from `navigate()` — hence the silent 404.
- The try/catch in `RequestHandler` also protects against any future extraction errors, not just NaN.
