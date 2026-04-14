# Issue: dev/app: Extract hard-coded routes from Router into a configuration object

## Description

`Router.build()` in `dev/app/lib/Router.js` hard-codes all four routes directly in the method body. Adding or changing routes requires modifying the `Router` class itself, violating the Open/Closed Principle and making route configuration impossible without a code change.

## Problem

- `Router.build()` (lines 26–29) embeds all route definitions inline, with no separation between routing logic and route configuration.
- New endpoints require editing production code instead of configuration.
- Testing route configuration in isolation is difficult.
- Routes are invisible to any introspection or tooling.

## Expected Behavior

- Routes should be defined in a dedicated configuration object or file.
- `Router.build()` should iterate over the route configuration, delegating registration to `RouteRegister`.
- Adding a new route requires only updating the configuration, not modifying `Router`.

## Solution

- Create a `routes.config.js` (or similar) that exports a `ROUTES` array:

```js
export const ROUTES = [
  { route: '/categories.json', attributes: ['id', 'name'] },
  { route: '/categories/:id.json', attributes: ['id', 'name'] },
  { route: '/categories/:id/items.json' },
  { route: '/categories/:id/items/:item_id.json' },
];
```

- Update `Router.build()` to iterate over `ROUTES`:

```js
build() {
  const router = ExpressRouter();
  const register = new RouteRegister(router, this.#data);
  ROUTES.forEach(route => register.register(route));
  return router;
}
```

## Benefits

- Decouples route configuration from routing logic.
- Makes routes visible and easy to audit.
- Simplifies adding or modifying routes without touching `Router` internals.
- Enables unit testing of route configuration independently.

## Affected Files

- `dev/app/lib/Router.js`

---
See issue for details: https://github.com/darthjee/navi/issues/282
