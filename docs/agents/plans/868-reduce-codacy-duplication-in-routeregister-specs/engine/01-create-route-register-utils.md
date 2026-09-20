# Create the RouteRegisterUtils helper
Add `source/spec/support/utils/RouteRegisterUtils.js` (class with static methods, JSDoc on each, `export { RouteRegisterUtils }`, matching `LoggerUtils`/`ResourceActionUtils` style) exposing:

- `setup(methods)` — installs `beforeEach`/`afterEach` doing exactly what the three files do today (`Logger.suppress()`, `LogRegistry.build()`, `LoggerUtils.stubLoggerMethods()`, a `router` whose listed methods are `jasmine.createSpy(name)`, `new RouteRegister(router)`; then `LogRegistry.reset()`, `Logger.reset()`). `methods` is the list of router methods to stub (`['get', 'post']`, `['get', 'patch']`), and `get` is always included. Returns a context object whose `router` and `register` properties are (re)assigned in `beforeEach`, so specs read `ctx.router` / `ctx.register`.
- `invoke({ ctx, verb, route, handler, req, res })` — calls `ctx.register[verb.registerName]({ route, handler })`, reads the callback with `ctx.router[verb.method].calls.mostRecent().args[1]`, and `await`s `callback(req, res)`. Defaults `req`/`res` to `{}` so a scenario only passes what it asserts on.
- `itBehavesLikeRouteRegistration(ctx, verb)` — the shared example. `verb` is a small config object, e.g. `{ method: 'post', registerName: 'registerPost', httpMethod: 'POST', route: '/api/config', failWith: (error) => handler-spy-that-rejects-with-error }` (for `get`: `registerName: 'register'`, `failWith` uses `and.throwError(error)`; for `post`/`patch`: `and.rejectWith(error)`). It generates, inside its own `describe`, the same scenarios the specs contain today:
  - registers a route on the router (`expect(router.<method>).toHaveBeenCalledWith(route, jasmine.any(Function))`)
  - calls `handler.handle` with `req`/`res`
  - logs debug `'<HTTP> <path> 200'` on success
  - a table `[ConflictError -> 409 'Conflict', ForbiddenError -> 403 'Forbidden', NotFoundError('Not found') -> 404 'Not found', Error('Unexpected') -> 500 'Internal Server Error']`, each generating `describe('when the handler throws a <Name>')` with `responds with <status>`, `responds with a <…> error body` and `logs debug with method, path and <status> status`, using a `res` built with `status().json` spies.

Keep the `describe`/`it` names the same as the current ones where they exist. Keep the helper free of production-code changes.

## Files to Change
- `source/spec/support/utils/RouteRegisterUtils.js` — new file with `setup`, `invoke` and `itBehavesLikeRouteRegistration`
