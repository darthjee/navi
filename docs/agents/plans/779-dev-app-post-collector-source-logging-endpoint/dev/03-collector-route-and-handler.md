# Add the collector route and CollectorHandler

Register `POST /collector/:source` and its handler, following the existing data-array +
`RequestHandler`-subclass conventions.

## Route config

Add `dev/app/lib/routing/collector_routes.config.js`:

```js
/**
 * Route definitions for the demo collector (emit target) endpoint.
 * Each entry is passed to {@link RouteRegister#register} with its method.
 *
 * @type {Array<{route: string, method: string}>}
 */
export const COLLECTOR_ROUTES = [
  { route: '/collector/:source', method: 'post' },
];
```

## Wiring

In `dev/app/lib/routing/Router.js#build()`, after the `REDIRECT_ROUTES` loop and **before**
`router.use(express.static(staticDir))` / the SPA catch-all `router.use(...)`:

```js
COLLECTOR_ROUTES.forEach(({ route, method }) => {
  register.register(route, new HandlerConfig(CollectorHandler), method);
});
```

Add imports for `CollectorHandler` (`../handlers/CollectorHandler.js`) and `COLLECTOR_ROUTES`
(`./collector_routes.config.js`), respecting ESLint `import/order`. The registration must
precede the static / catch-all `use()` calls, or a POST would fall through to the SPA handler
and return `index.html` with 200.

## Handler

Add `dev/app/lib/handlers/CollectorHandler.js`, a `RequestHandler` subclass mirroring
`IndexHandler` (no extra constructor params):

- `constructor(request, response)` — call `super()`, store both in `#`-private fields.
- `handle()` — read `source` from `this.#request.params`, `body` from `this.#request.body`
  (default to `{}` when `undefined`), call
  `Logger.info('CollectorHandler: received emission', { source, body })`, then
  `this.#response.status(204).end()`.
- Named imports: `{ RequestHandler }` from `../common/server/RequestHandler.js` and
  `{ Logger }` from `../common/utils/logging/Logger.js` (alphabetical within the
  parent/sibling group). `sort-class-members` order: properties → constructor → public methods.
- No persistence, no GET counterpart. `:source` is logged verbatim — no validation.

## Handler spec

Add `dev/app/spec/lib/handlers/CollectorHandler_spec.js`, mirroring
`spec/lib/handlers/ContentHandler_spec.js`:

- `spyOn(Logger, 'info')` in `beforeEach` (import `{ Logger }` from
  `../../../lib/common/utils/logging/Logger.js`).
- With `req = { params: { source: 'x' }, body: { foo: 'bar' } }` and a fake `res` whose
  `status` is a spy returning `{ end: endSpy }`: assert `Logger.info` was called with
  `('CollectorHandler: received emission', { source: 'x', body: { foo: 'bar' } })`,
  `res.status` with `204`, and `endSpy` called.
- Missing / empty body (`req` without `body`) still logs `body: {}` and responds `204`.
- `new CollectorHandler({}, {})` `toBeInstanceOf(RequestHandler)`.

## Files to Change

- `dev/app/lib/routing/collector_routes.config.js` — new: `COLLECTOR_ROUTES`.
- `dev/app/lib/routing/Router.js` — import `CollectorHandler` + `COLLECTOR_ROUTES`; add the
  `COLLECTOR_ROUTES.forEach` registration before the static / SPA `use()` calls.
- `dev/app/lib/handlers/CollectorHandler.js` — new: the handler class.
- `dev/app/spec/lib/handlers/CollectorHandler_spec.js` — new: handler unit coverage.
