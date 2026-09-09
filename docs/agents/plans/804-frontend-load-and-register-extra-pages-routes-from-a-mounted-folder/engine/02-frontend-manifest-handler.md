# `FrontendManifestHandler` (`GET /extensions/frontend.json`)

A new `RequestHandler` subclass that enumerates the mounted frontend bundle
folder and returns the discovery manifest (shared contract #1). The folder is the
source of truth; the manifest carries no route/menu/component data.

## Behaviour

1. Read `ExtensionsEnv`. If `!ExtensionsEnv.enabled` → `response.json({ bundles: [] })`, return.
2. `dir = ExtensionsEnv.frontendDir`. If `dir` is absent / not a directory
   (`fs.statSync(dir).isDirectory()` guarded by try/catch, same helper shape as
   `ExtensionRoutesLoader.#isDirectory`) → `response.json({ bundles: [] })`, return.
3. `names = fs.readdirSync(dir).filter(n => n.endsWith('.js')).sort()` — flat,
   non-recursive, lexicographic. (Nested directories are simply not `.js` files;
   no error.)
4. For each `name`, build `{ src: \`/extensions/frontend/${name}\` }` and, when
   `fs.existsSync(path.join(dir, name.replace(/\.js$/, '.css')))`, add
   `css: \`/extensions/frontend/${name.replace(/\.js$/, '.css')}\``.
5. `response.json({ bundles })`.

No path-traversal concern here (filenames come from `readdirSync`, not the
request), but do not follow into subdirectories.

## Construction

Follow the `RequestHandler` + `HandlerConfig` convention: constructor
`(_request, response)` (no extra args — it reads `ExtensionsEnv` itself), private
`#response`, `handle()` does the work. Registered via
`new HandlerConfig(FrontendManifestHandler)` in `Router.build()` (step 04).

## Files to Change

- `source/lib/server/handlers/FrontendManifestHandler.js` — new file.
- `source/spec/lib/server/handlers/FrontendManifestHandler_spec.js` — new file.
  Cover: disabled → `{ bundles: [] }`; enabled but dir missing → `{ bundles: [] }`;
  enabled with `a.js`, `b.js`, `b.css` present → bundles in lexicographic order,
  `b` carries `css`, `a` does not; non-`.js` files ignored; `instanceof RequestHandler`.
  Use a temp fixture dir (mirror `source/spec/fixtures/extensions/` layout) or
  stub `fs` — match whatever `ExtensionRoutesLoader_spec.js` does.
