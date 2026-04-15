# Plan: RouteRegister has no duplicate detection and no introspection of registered routes

## Overview

Add a private `#routes` array to `RouteRegister` that tracks registered patterns. Throw an error on duplicate registration. Expose a `routes()` method that returns a copy of the registered patterns. Add corresponding tests.

## Context

`RouteRegister#register()` currently delegates straight to `this.#router.get()` with no tracking. Registering the same pattern twice is silently accepted by Express (first handler wins), and there is no way to inspect registered state without interrogating Express internals.

## Implementation Steps

### Step 1 — Add `#routes` tracking and duplicate guard

Add a private `#routes` array initialised in the constructor. In `register()`, check for a duplicate before proceeding:

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
}
```

### Step 2 — Add the `routes()` accessor

Expose the registered patterns as a defensive copy:

```js
routes() {
  return [...this.#routes];
}
```

### Step 3 — Add tests to `RouteRegister_spec.js`

Add two new `describe` blocks:

**`#routes`** — verifies the accessor returns registered patterns in order:

```js
describe('#routes', () => {
  it('returns the list of registered route patterns', () => {
    const register = new RouteRegister(express(), data);
    register.register({ route: '/categories.json' });
    register.register({ route: '/categories/:id.json' });
    expect(register.routes()).toEqual(['/categories.json', '/categories/:id.json']);
  });
});
```

**Duplicate detection** — verifies an error is thrown when the same pattern is registered twice:

```js
describe('when the same route is registered twice', () => {
  it('throws an error identifying the duplicate', () => {
    const register = new RouteRegister(express(), data);
    register.register({ route: '/categories.json' });
    expect(() => register.register({ route: '/categories.json' }))
      .toThrowError('RouteRegister: duplicate route "/categories.json"');
  });
});
```

## Files to Change

- `dev/app/lib/RouteRegister.js` — add `#routes` field, duplicate guard in `register()`, and `routes()` accessor
- `dev/app/spec/lib/RouteRegister_spec.js` — add tests for `#routes` accessor and duplicate detection

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/app`: `yarn test` (CircleCI job: `jasmine-dev`)
- `dev/app`: `yarn lint` (CircleCI job: `checks-dev`)

## Notes

- All existing tests pass unchanged; they each create a fresh `RouteRegister` with distinct patterns.
- The `routes()` method returns a shallow copy so callers cannot mutate the internal state.
- The `sort-class-members` ESLint rule is active in the dev app — `routes()` should be placed after `register()` alphabetically, or in the order the rule expects. Check the existing order to stay compliant.
