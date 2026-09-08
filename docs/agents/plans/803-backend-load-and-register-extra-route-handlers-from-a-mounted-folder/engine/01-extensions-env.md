# ExtensionsEnv resolver + fatal-mount exception

Add the single source of truth for the two extension environment variables, plus
the exception used for the one fatal case ("enabled but the mount isn't there").

**`ExtensionsEnv`** — read `process.env` on every access (tests mutate
`process.env`), no caching:

- `ExtensionsEnv.enabled` → `true` only when
  `String(process.env.NAVI_EXTENSIONS_ENABLED ?? '').trim().toLowerCase()` is one
  of `1`, `true`, `yes`, `on`; `false` otherwise. Keep the accepted list as a
  module-level `const` so step 07 can document it verbatim.
- `ExtensionsEnv.dir` → `process.env.NAVI_EXTENSIONS_DIR` when it is a non-empty
  string, else `/navi/extensions` (module-level `const DEFAULT_EXTENSIONS_DIR`).
- `ExtensionsEnv.backendDir` → `path.join(ExtensionsEnv.dir, 'backend')`
  convenience getter.

Implement as static getters on a class that is never instantiated (matches the
"class declarer, not a script" rule; `BaseLogger` is the env-reading precedent).

**`ExtensionsDirectoryMissing`** — `extends AppError`, thrown by the loader
(step 03) when extensions are enabled but `NAVI_EXTENSIONS_DIR` is unset / does
not exist / is not a directory. Message names the offending path. Mirrors
`MenuConfigurationInvalid`'s fail-fast posture (`ConfigIncluder` on a broken
root).

Specs: truthy/falsey matrix for `enabled` (unset, ``, `0`, `false`, `no`, `off`,
` TRUE `, `yes`, `1`, `on`, `maybe`); `dir` default vs. override vs. empty
string; `backendDir` join. Exception spec: `instanceof AppError`, message
contains the path.

## Files to Change

- `source/lib/server/extensions/ExtensionsEnv.js` — new; static `enabled` / `dir`
  / `backendDir` getters reading `process.env`; module `const`s for the truthy
  list and the default dir.
- `source/lib/exceptions/config/ExtensionsDirectoryMissing.js` — new; `extends
  AppError`, `constructor(dir)` builds a message naming `dir`.
- `source/spec/lib/server/extensions/ExtensionsEnv_spec.js` — new.
- `source/spec/lib/exceptions/config/ExtensionsDirectoryMissing_spec.js` — new.
