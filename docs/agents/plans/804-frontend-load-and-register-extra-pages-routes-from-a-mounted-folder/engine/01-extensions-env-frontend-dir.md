# Add `ExtensionsEnv.frontendDir`

`ExtensionsEnv` already exposes `dir` and `backendDir`. Add a symmetric
`frontendDir` static getter returning `path.join(ExtensionsEnv.dir, 'frontend')`,
so both new frontend handlers resolve their base directory the same way the
backend loader resolves `backendDir`.

Keep it a plain getter (no caching, reads `dir` fresh) to match the existing
class contract — "reads `process.env` on every access".

## Files to Change

- `source/lib/server/extensions/ExtensionsEnv.js` — add `static get frontendDir()`
  returning `path.join(ExtensionsEnv.dir, 'frontend')`; JSDoc mirroring
  `backendDir`.
- `source/spec/lib/server/extensions/ExtensionsEnv_spec.js` — add a `frontendDir`
  describe block: default (`/navi/extensions/frontend`), honours a custom
  `NAVI_EXTENSIONS_DIR`, recomputed after `process.env` mutation.
