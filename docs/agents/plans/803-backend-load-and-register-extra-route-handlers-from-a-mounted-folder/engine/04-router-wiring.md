# Hoist stock route keys + register extension routes in Router

Two changes to `source/lib/server/Router.js`.

## 1. Export a frozen set of stock route keys

The `GET_ROUTES` / `PATCH_ROUTES` / `POST_ROUTES` maps are built inside
`build()` because they close over `this.#webConfig` / `this.#menuConfig`, so they
cannot become plain module constants. Instead add a **config-independent**
module-level constant listing every stock `"<METHOD> <path>"` key:

```js
const STOCK_ROUTE_KEYS = Object.freeze(new Set([
  'GET /settings.json', 'GET /stats.json', /* …every GET path… */,
  'GET /' , 'GET /assets/*path',
  'PATCH /jobs/:id/retry', /* …every PATCH path… */,
  'POST /api/config', 'POST /api/engine/start', 'POST /api/engine/stop',
]));
```

Export it (`export { Router, STOCK_ROUTE_KEYS };`). Add a **drift guard** spec:
build the router with no args, walk `expressRouter.stack` collecting
`` `${method.toUpperCase()} ${layer.route.path}` `` for every layer that has a
`route`, and assert the collected set equals `STOCK_ROUTE_KEYS` (minus the
catch-all middleware, which has no `route`). This fails loudly if someone adds a
stock route later without updating the constant.

`ApplicationInstance` (step 05) passes `STOCK_ROUTE_KEYS` into
`ExtensionRoutesLoader.load({ stockRouteKeys: STOCK_ROUTE_KEYS })`.

## 2. Register extension routes

- Constructor: accept `extensionRoutes = []` in the options object, store on a
  private field. JSDoc: `Array<{ method, path, handler }>`.
- In `build()`, **after** the three `Object.entries(...).forEach(register…)`
  loops and **before** `router.use(express.static(staticDir))`:

  ```js
  this.#extensionRoutes.forEach(({ method, path: route, handler }) => {
    const config = new HandlerConfig(handler);
    if (method === 'GET') register.register({ route, handler: config });
    else if (method === 'PATCH') register.registerPatch({ route, handler: config });
    else register.registerPost({ route, handler: config });
  });
  ```

  `HandlerConfig(handler)` with no params → `new handler(req, res)` per request,
  exactly like stock handlers. The loader has already validated `method`, so the
  three-way branch is total; keep it small to stay under complexity 10 (extract a
  helper if needed).

The descriptors are already collision-checked by the loader, so `build()` does no
filtering — it trusts its input.

## Specs (`Router_spec.js`)

- new `STOCK_ROUTE_KEYS` drift-guard test (above).
- `new Router({ extensionRoutes: [{ method: 'GET', path: '/ext/x.json', handler: H }] }).build()`
  registers `GET /ext/x.json`; the layer's handler, invoked with a fake
  `req`/`res`, calls `H`'s `handle()`.
- a PATCH and a POST extension descriptor likewise land on the router with the
  right method.
- extension routes appear in the stack **after** the stock routes and **before**
  the `express.static` / catch-all middleware (assert relative index).
- default `extensionRoutes` (`new Router().build()`) → stack identical to today.

## Files to Change

- `source/lib/server/Router.js` — add `STOCK_ROUTE_KEYS` module const + export;
  add `extensionRoutes` constructor option; register the descriptors in `build()`
  after the stock loops.
- `source/spec/lib/server/Router_spec.js` — drift guard + extension-route
  registration/ordering tests.
