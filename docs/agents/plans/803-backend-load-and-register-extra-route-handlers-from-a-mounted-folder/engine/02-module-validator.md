# Extension module & descriptor validator

A small pure module that turns a freshly `import()`ed extension module object into
either a list of accepted descriptors or a list of human-readable rejection
reasons. Kept separate from the loader to stay under the complexity / file-size
limits and to be unit-testable without touching the filesystem or `import()`.

**`ExtensionModuleValidator.validate(moduleNamespace)`** → returns
`{ descriptors: Array<{ method, path, handler }>, errors: Array<string> }`.

Rules (from SPEC-3 "Route declaration & module contract" / "Error handling"):

1. Resolve `raw = moduleNamespace.default ?? moduleNamespace.routes`. If `raw` is
   not an array → single error `"neither a default export nor a 'routes' export
   is an array"`, no descriptors.
2. For each entry, by index:
   - not a plain object → `"descriptor <i> is not an object"`.
   - `method` missing or, upper-cased, not in `{GET, PATCH, POST}` →
     `"descriptor <i> has unsupported method \"<value>\""`.
   - `path` not a non-empty string, or does not start with `/`, or contains
     whitespace → `"descriptor <i> has an invalid path \"<value>\""`.
   - `handler` not a function → `"descriptor <i> handler is not a class"`.
   - otherwise push the normalised descriptor `{ method: method.toUpperCase(),
     path, handler }`.
3. A module with a mix of valid and invalid entries returns the valid ones **and**
   the errors for the bad ones (the loader logs each error, keeps the good
   descriptors) — matches SPEC-3 "keep the bundle's other descriptors".

No throwing — the loader decides what to do with `errors`.

Specs: valid `default` array; valid `routes` named export; `default` wins when
both present; non-array → error; each individual rejection reason; mixed
valid/invalid; case-insensitive method normalisation; `path` with a space / not
`/`-prefixed / empty.

## Files to Change

- `source/lib/server/extensions/ExtensionModuleValidator.js` — new; single static
  `validate(moduleNamespace)` returning `{ descriptors, errors }`.
- `source/spec/lib/server/extensions/ExtensionModuleValidator_spec.js` — new.
