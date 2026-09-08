# ExtensionRoutesLoader

The orchestrator. One `async` static `load({ stockRouteKeys })` that returns a
ready-to-register `Array<{ method, path, handler }>` — validated, de-collided,
lexicographically ordered — or `[]`. Called once from
`ApplicationInstance.run()` (step 05).

## Behaviour (SPEC-3 "Loading mechanism" / "Error handling" / "Collision handling")

1. `if (!ExtensionsEnv.enabled) return [];` — no filesystem access at all.
2. Resolve `dir = ExtensionsEnv.dir`. If `dir` is unset / does not exist / is not
   a directory → `throw new ExtensionsDirectoryMissing(dir)` (fail-fast; the one
   fatal case).
3. Resolve `backendDir = ExtensionsEnv.backendDir`. If it is absent / not a
   directory → `Logger.info('[extensions] no backend extensions (…)')` and
   `return []`.
4. `fs.readdirSync(backendDir)` (boot-time, sync fs is fine here — this is not in
   the engine loop), keep entries ending in `.js`, sort lexicographically.
5. For each filename:
   - `resolved = path.resolve(backendDir, name)`;
     `new PathValidator(backendDir).validate(resolved)` — on `ForbiddenError`,
     `Logger.warn('[extensions] skipping <name>: path escapes backend/')` and
     skip (do not let it bubble).
   - `try { mod = await import(pathToFileURL(resolved).href); }
     catch (e) { Logger.warn('[extensions] skipping <name>: ' + e.message); continue; }`
   - `{ descriptors, errors } = ExtensionModuleValidator.validate(mod);`
     `errors.forEach(msg => Logger.warn('[extensions] skipping <name>: ' + msg));`
   - For each descriptor, build key `` `${method} ${path}` ``:
     - in `stockRouteKeys` → `Logger.warn('[extensions] skipping <method> <path>
       from <name>: path is a built-in Navi route')`, skip.
     - already in the accumulator's seen-set → `Logger.warn('[extensions]
       skipping <method> <path> from <name>: already registered by <firstFile>')`,
       skip.
     - else record `{ ...descriptor, source: name }` and add the key to the
       seen-set.
6. Emit one audit line:
   `Logger.info('[extensions] loaded <n> backend route(s): ' + list.join(', '))`
   where each item is `` `${method} ${path} (${source})` `` (SPEC-3 example
   format). `n === 0` still logs (`loaded 0 backend route(s):`).
7. Return the accumulated descriptors **without** the `source` field, or keep
   `source` if step 04 wants it for logging — pick one and keep it consistent
   with step 04's registration code.

Keep the per-file work in a private helper to stay under complexity 10 /
nesting 4.

## Test fixtures

Real `.js` files under `source/spec/support/fixtures/extensions/` — point
`NAVI_EXTENSIONS_DIR` at a chosen subfolder per example. Each fixture handler
imports the base class by **relative path** from the fixtures dir (self-reference
via `navi-hey/extension` is verified separately in step 06). Suggested set:

- `ok/backend/a_health.js` — one GET descriptor, responds `res.json(...)`.
- `ok/backend/b_reindex.js` — one POST `async handle()` descriptor.
- `broken-import/backend/bad.js` — `throw new Error('boom')` at module top level.
- `bad-shape/backend/no_array.js` — `export default { nope: true }`.
- `bad-descriptor/backend/bad_method.js` — `[{ method: 'DELETE', path: '/x',
  handler: class extends RequestHandler {} }]`.
- `collision-stock/backend/stats.js` — GET `/stats.json` (clashes with a stock
  route).
- `collision-extra/backend/one.js` + `two.js` — both declare POST `/ext/dup`.
- `traversal/backend/` + a symlink `evil.js -> ../../../../etc/hostname` (create
  the symlink in the spec `beforeAll` with `fs.symlinkSync`, not committed, so it
  is portable and never a repo hazard).
- non-`.js` sibling (`ok/backend/readme.md`) to prove it is ignored.

## Specs (`ExtensionRoutesLoader_spec.js`)

- disabled flag → `[]`, and `fs` is never read (spy on `fs.readdirSync`).
- enabled + dir missing → rejects with `ExtensionsDirectoryMissing`.
- enabled + `backend/` absent → `[]` + one `Logger.info`.
- happy path → returns both descriptors, ordered `a_health` before `b_reindex`,
  audit line lists both with source filenames.
- broken-import fixture → that module skipped with a `Logger.warn`, others still
  returned, no throw.
- bad-shape / bad-descriptor → skipped with `Logger.warn`.
- collision vs stock → extra dropped, `Logger.warn` mentions "built-in".
- collision extra-vs-extra → `one.js` wins, `two.js` dropped, `Logger.warn`
  mentions `one.js`.
- traversal symlink → dropped via `PathValidator`, `Logger.warn`, no throw.
- non-`.js` file ignored silently.

Use `Logger.suppress()` in `beforeEach` and spy on `Logger.warn` / `Logger.info`
to assert messages, mirroring existing server specs.

## Files to Change

- `source/lib/server/extensions/ExtensionRoutesLoader.js` — new; `async
  load({ stockRouteKeys })`, private per-file helper, uses `ExtensionsEnv`,
  `PathValidator`, `ExtensionModuleValidator`, `Logger`, `ExtensionsDirectoryMissing`.
- `source/spec/lib/server/extensions/ExtensionRoutesLoader_spec.js` — new.
- `source/spec/support/fixtures/extensions/**` — new fixture modules listed above.
