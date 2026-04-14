# Plan: dev/app: Extract hard-coded routes from Router into a configuration object

## Overview

Extract the four hard-coded `register.register(...)` calls from `Router#build()` into a dedicated `routes.config.js` file that exports a `ROUTES` constant. Update `Router` to iterate over this configuration. Add a unit test for the new config file.

## Context

`dev/app/lib/Router.js` currently lists all four route definitions inline inside `build()`. This makes adding routes require modifying `Router` itself (Open/Closed Principle violation), and makes it impossible to test or inspect the route list in isolation.

## Implementation Steps

### Step 1 — Create `dev/app/lib/routes.config.js`

Create a new file that exports the `ROUTES` array:

```js
export const ROUTES = [
  { route: '/categories.json', attributes: ['id', 'name'] },
  { route: '/categories/:id.json', attributes: ['id', 'name'] },
  { route: '/categories/:id/items.json' },
  { route: '/categories/:id/items/:item_id.json' },
];
```

### Step 2 — Update `dev/app/lib/Router.js`

Import `ROUTES` and replace the four explicit `register.register(...)` calls with a `forEach` loop:

```js
import { ROUTES } from './routes.config.js';

build() {
  const router = ExpressRouter();
  const register = new RouteRegister(router, this.#data);
  ROUTES.forEach(route => register.register(route));
  return router;
}
```

### Step 3 — Add unit tests for `routes.config.js`

Create `dev/app/spec/lib/routes.config_spec.js` to verify the shape and content of the `ROUTES` array (route strings, attributes, length), independent of Express.

### Step 4 — Verify existing tests still pass

The existing `Router_spec.js` and `app_spec.js` exercise all four routes via HTTP — they should pass unchanged since `Router#build()` produces the same router. Run the full suite to confirm.

## Files to Change

- `dev/app/lib/routes.config.js` — **new file**: defines and exports the `ROUTES` constant
- `dev/app/lib/Router.js` — replace inline `register.register(...)` calls with `ROUTES.forEach(...)`
- `dev/app/spec/lib/routes.config_spec.js` — **new file**: unit tests for the `ROUTES` array

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/app`: `yarn test` (CircleCI job: `jasmine-dev`)
- `dev/app`: `yarn lint` (CircleCI job: `checks-dev`)

## Notes

- `Router_spec.js` tests routes via HTTP end-to-end and should not need to change.
- The new `routes.config_spec.js` should be a pure unit test: import `ROUTES` and assert its structure without instantiating Express.
