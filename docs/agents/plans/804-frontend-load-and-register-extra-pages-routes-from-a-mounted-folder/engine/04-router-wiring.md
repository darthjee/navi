# Wire both routes into `Router.build()` + `STOCK_ROUTE_KEYS`

Register the two new GET routes in `Router.build()` **after** the stock
`GET_ROUTES` map is registered and **before** `router.use(express.static(staticDir))`
and the catch-all `IndexHandler` — the same position the backend extension routes
use, so `/extensions/*` never falls through to the SPA fallback.

## Changes

1. In `Router.build()`, after the `Object.entries(GET_ROUTES).forEach(...)` loop
   (and alongside / before `this.#registerExtensionRoutes(register)`), register:

   ```js
   register.register({
     route: '/extensions/frontend.json',
     handler: new HandlerConfig(FrontendManifestHandler),
   });
   register.register({
     route: '/extensions/frontend/*path',
     handler: new HandlerConfig(FrontendAssetsHandler),
   });
   ```

   These are static (config-independent) routes, so they may equally be added as
   two entries in the `GET_ROUTES` object literal — pick whichever reads cleaner
   next to the existing `'/assets/*path'` entry. Keep them ordered after
   `'/assets/*path'`.
2. Import both handler classes at the top of `Router.js`.
3. Add both keys to the frozen `STOCK_ROUTE_KEYS` set:
   `'GET /extensions/frontend.json'` and `'GET /extensions/frontend/*path'`, so a
   backend extension cannot shadow them (and the drift-guard spec stays green).

## Files to Change

- `source/lib/server/Router.js` — imports, two `register.register(...)` calls (or
  two `GET_ROUTES` entries), two new `STOCK_ROUTE_KEYS` members.
- `source/spec/lib/server/Router_spec.js` — assert both routes are registered and
  reachable (200 for the manifest when disabled → `{ bundles: [] }`; 404 for the
  asset route when disabled); extend the `STOCK_ROUTE_KEYS` drift-guard
  assertion to include the two new keys.
