# Make RouteRegister method-aware

`dev/app/lib/routing/RouteRegister.js#register()` hard-codes `this.#router.get(route, ...)`.
Generalise it to accept an HTTP method instead of adding a parallel `registerPost`, so the
existing config-array → `HandlerConfig` → `RouteRegister` style carries POST routes too.

- `register(route, handler, method = 'get')` — dispatch via
  `this.#router[method](route, (req, res) => handler.handle(req, res))`. The default keeps
  every existing caller working untouched: `Router.build()`'s `ROUTES` / `REDIRECT_ROUTES`
  loops and `spec/support/utils/AppFactory.js`.
- Key the duplicate-route guard by `` `${method} ${route}` `` (not the bare pattern), and
  store that composite key in `#routes`, so the same path can carry different verbs.
- `routes()` now returns the composite `"<method> <route>"` keys. No production code consumes
  `routes()` — only `RouteRegister_spec.js` — so update its three `routes()` assertions
  (currently `['/categories.json', '/categories/:id.json']`, `[]`, `['/categories']`) to the
  `'get /…'` form.
- Update the class-level and `register()` JSDoc that currently say "registers GET routes".

Spec additions in `spec/lib/routing/RouteRegister_spec.js`:

- A `method: 'post'` registration is stored as `'post /…'` in `routes()` and binds POST
  (assert against a stub router that records `get` / `post` calls, mirroring the existing
  stub pattern in that spec).
- The duplicate guard is method-scoped: registering `post` + `/x` twice throws, but `get` +
  `/x` followed by `post` + `/x` does not.

## Files to Change

- `dev/app/lib/routing/RouteRegister.js` — add the `method` parameter, method dispatch via
  `this.#router[method]`, composite dup-guard key, updated `routes()` output, updated doc
  comments.
- `dev/app/spec/lib/routing/RouteRegister_spec.js` — update the three `routes()` assertions to
  the composite-key form; add POST-registration and method-scoped duplicate-guard coverage.
