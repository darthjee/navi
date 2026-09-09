# `FrontendAssetsHandler` (`GET /extensions/frontend/*path`)

A new `RequestHandler` subclass modeled directly on `AssetsHandler`, serving the
`.js` / `.css` bundle files straight from the mounted `frontend/` folder with
path-traversal protection (shared contract #2). No copy into `source/static/`.

## Behaviour

1. If `!ExtensionsEnv.enabled` → `throw new NotFoundError()` before any
   filesystem access (a disabled deployment with a volume still mounted exposes
   nothing). `RouteRegister` maps this to 404.
2. `baseDir = ExtensionsEnv.frontendDir`;
   `validator = new PathValidator(baseDir)`.
3. `rel = [].concat(request.params.path).join(path.sep)` (identical to
   `AssetsHandler`).
4. `resolved = path.resolve(baseDir, rel)`; `validator.validate(resolved)` —
   throws `ForbiddenError` on `..` / escape → `RouteRegister` maps to 403.
5. `response.sendFile(resolved)` — Express infers `Content-Type` from the
   extension; a missing file resolves through `sendFile`'s error path to 404
   (same behaviour as `AssetsHandler`).

Optionally reuse `ExtensionRoutesLoader`'s `fs.realpathSync` + revalidate step to
also reject symlink escapes; keep it consistent with whichever guard the backend
loader ended up shipping.

## Construction

Constructor `(request, response)` — reads `ExtensionsEnv` itself, so unlike
`AssetsHandler` it does **not** take `assetsDir` / `validator` args (those are
env-derived and must be read per request, not frozen at `Router` module load).
Registered via `new HandlerConfig(FrontendAssetsHandler)` in `Router.build()`
(step 04).

## Files to Change

- `source/lib/server/handlers/FrontendAssetsHandler.js` — new file.
- `source/spec/lib/server/handlers/FrontendAssetsHandler_spec.js` — new file.
  Cover: disabled → `NotFoundError` (no `sendFile` call); enabled + valid path →
  `res.sendFile` with the resolved absolute path; `../` traversal →
  `ForbiddenError`; `instanceof RequestHandler`. Mirror `AssetsHandler_spec.js`'s
  structure and `res.sendFile` spy.
