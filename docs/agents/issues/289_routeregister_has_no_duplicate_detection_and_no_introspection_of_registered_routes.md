# Issue: RouteRegister has no duplicate detection and no introspection of registered routes

## Description

`RouteRegister` registers routes by mutating an Express router in-place with no tracking of what has been registered. This means duplicate routes are silently accepted (the first handler always wins), there is no way to list registered routes for debugging or testing, and registration order is implicit with no safeguards.

## Problem

- Calling `register({ route })` twice with the same pattern silently creates two Express handlers; only the first ever matches. There is no error or warning.
- There is no way to inspect which routes have been registered without interrogating the Express router internals.
- Registration order determines matching priority but is not enforced or documented anywhere.

## Expected Behavior

- Registering the same route pattern twice should throw an error (or at minimum log a warning) identifying the duplicate.
- A `routes()` (or similar) method should return the list of currently registered route patterns, making it easy to assert in tests and inspect during debugging.

## Solution

Track registered routes in a private `Set` (or array):

```js
class RouteRegister {
  #router;
  #data;
  #routes;

  constructor(router, data) {
    this.#router = router;
    this.#data = data;
    this.#routes = [];
  }

  register({ route, attributes } = {}) {
    if (this.#routes.includes(route)) {
      throw new Error(`RouteRegister: duplicate route "${route}"`);
    }
    this.#routes.push(route);
    const serializer = attributes ? new Serializer(attributes) : null;
    const handler = new RequestHandler(route, this.#data, serializer);
    this.#router.get(route, (req, res) => handler.handle(req, res));
  }

  routes() {
    return [...this.#routes];
  }
}
```

- Add tests in `RouteRegister_spec.js` for duplicate detection and the `routes()` method.

## Benefits

- Duplicate route bugs are caught immediately at registration time.
- Tests can verify route lists without relying on HTTP integration tests.
- Easier to understand the registered state of the router.

## Affected Files

- `dev/app/lib/RouteRegister.js`
- `dev/app/spec/lib/RouteRegister_spec.js`

---
See issue for details: https://github.com/darthjee/navi/issues/289
