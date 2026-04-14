# Issue: dev/app: RequestHandler instantiates RouteParamsExtractor directly, preventing injection

## Description

`RequestHandler#handle()` constructs a `RouteParamsExtractor` inline, hard-wiring the extraction strategy inside the handler. This makes it impossible to substitute a different extractor without modifying the class, and forces tests to exercise the real `RouteParamsExtractor` even when testing unrelated handler logic.

## Problem

- `new RouteParamsExtractor(this.#route, req.params)` is called directly inside `handle()`, making the dependency invisible at construction time.
- Unit tests cannot isolate `RequestHandler` from `RouteParamsExtractor`.
- Changing the extraction strategy requires modifying `RequestHandler` itself.

## Expected Behavior

- The extractor creation should be injectable via the constructor.
- A default factory should be provided so existing callers require no changes.
- Tests can pass a custom factory to exercise `RequestHandler` in isolation.

## Solution

Accept an optional `extractorFactory` in the constructor, defaulting to the real `RouteParamsExtractor`:

```js
constructor(route, data, serializer = null, extractorFactory = null) {
  this.#route = route;
  this.#data = data;
  this.#serializer = serializer;
  this.#extractorFactory = extractorFactory
    ?? ((route, params) => new RouteParamsExtractor(route, params));
}

handle(req, res) {
  try {
    const steps = this.#extractorFactory(this.#route, req.params).steps();
    const result = new DataNavigator(this.#data, steps).navigate();
    if (result === null) return notFound(res);
    res.json(this.#serializer ? this.#serializer.serialize(result) : result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
```

- Add tests in `RequestHandler_spec.js` that inject a custom factory to verify the handler uses it.

## Benefits

- `RequestHandler` tests can fully isolate from `RouteParamsExtractor`.
- The extraction strategy can be changed or extended without modifying `RequestHandler`.
- The dependency is explicit and visible at construction time.

## Affected Files

- `dev/app/lib/RequestHandler.js`
- `dev/app/spec/lib/RequestHandler_spec.js`

---
See issue for details: https://github.com/darthjee/navi/issues/285
