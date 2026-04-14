# Plan: dev/app: RequestHandler instantiates RouteParamsExtractor directly, preventing injection

## Overview

Add an optional `extractorFactory` constructor parameter to `RequestHandler`, defaulting to a factory that creates the real `RouteParamsExtractor`. Replace the inline `new RouteParamsExtractor(...)` call in `handle()` with `this.#extractorFactory(...)`. Add tests that inject a custom factory.

## Context

`RequestHandler#handle()` currently calls `new RouteParamsExtractor(this.#route, req.params)` directly (already inside a try/catch added in issue #283). This couples the handler to the concrete extractor class. Making the factory injectable lets tests stub or replace the extractor without touching production code, and allows future callers to supply alternative extraction strategies.

## Implementation Steps

### Step 1 — Add `#extractorFactory` to `RequestHandler`

Add the private field and update the constructor:

```js
class RequestHandler {
  #route;
  #data;
  #serializer;
  #extractorFactory;

  constructor(route, data, serializer = null, extractorFactory = null) {
    this.#route = route;
    this.#data = data;
    this.#serializer = serializer;
    this.#extractorFactory = extractorFactory
      ?? ((route, params) => new RouteParamsExtractor(route, params));
  }
```

Update `handle()` to use the factory:

```js
const steps = this.#extractorFactory(this.#route, req.params).steps();
```

Update the JSDoc `@param` block to document `extractorFactory`.

### Step 2 — Add injection tests to `RequestHandler_spec.js`

Add a `describe` block that passes a custom factory and verifies the handler delegates to it:

```js
describe('with a custom extractorFactory', () => {
  it('uses the steps returned by the injected factory', async () => {
    const factory = (_route, _params) => ({ steps: () => ['categories', 1] });
    const app = express();
    const handler = new RequestHandler('/any/:x.json', data, null, factory);
    app.get('/any/:x.json', (req, res) => handler.handle(req, res));

    const res = await request(app).get('/any/99.json');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(BOOKS_CATEGORY);  // navigates to categories[1]
  });
});
```

## Files to Change

- `dev/app/lib/RequestHandler.js` — add `#extractorFactory` field, update constructor and `handle()`, update JSDoc
- `dev/app/spec/lib/RequestHandler_spec.js` — add test for injected factory

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/app`: `yarn test` (CircleCI job: `jasmine-dev`)
- `dev/app`: `yarn lint` (CircleCI job: `checks-dev`)

## Notes

- All existing tests continue to pass unchanged — `extractorFactory` defaults to the real `RouteParamsExtractor` factory.
- The injected factory receives `(route, params)` and must return an object with a `steps()` method, matching the `RouteParamsExtractor` interface.
- `RouteRegister` constructs `RequestHandler` with three arguments; it is unaffected by the new optional fourth parameter.
