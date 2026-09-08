# Add the navi-hey/extension exports map

Give extension authors a version-stable specifier for the handler base class, and
let the spec fixtures use the same string via Node self-referencing.

## Change

`source/package.json` — add:

```json
"exports": {
  ".": "./bin/navi.js",
  "./extension": "./lib/common/server/RequestHandler.js",
  "./package.json": "./package.json"
}
```

- `.` is kept pointing at the current `main` target (`bin/navi.js`) so nothing
  about the `navi-hey` CLI/bin changes. (`main` stays as-is; `exports` wins when
  both are present, so they must agree.)
- `./extension` → `RequestHandler` is the canonical contract from
  `downstream-extension-workflow.md`. If/when token wiring lands, a future issue
  adds `./extension/secured` → `lib/server/SecuredRequestHandler.js`.
- `./package.json` is explicitly re-exported because some tooling (jsdoc, eslint
  resolvers) reads it and `exports`, once present, blocks unlisted subpaths.

Also add `lib` is already in `files`; confirm nothing else needs listing.

## Verification (do all three in `source/`)

1. `yarn lint` — clean.
2. `yarn test` — full suite green, in particular any spec importing
   `navi-hey/extension` (add a one-line spec:
   `import { RequestHandler } from 'navi-hey/extension'` then
   `expect(typeof RequestHandler).toBe('function')`) proves self-referencing
   resolves under `spec/`.
3. `yarn docs` (`jsdoc -c jsdoc.json`) — still generates without a resolution
   error introduced by `exports`.

Also sanity-check that `clients/node` (separate package `navi-hey-client`) does
not import from `navi-hey` by path — `grep -rn "navi-hey/" clients/node/lib` — it
should not, but confirm.

## Files to Change

- `source/package.json` — add the `exports` map.
- `source/spec/lib/common/server/RequestHandler_spec.js` — add a case importing
  via `navi-hey/extension` (or a new tiny `spec/lib/extension_export_spec.js`).
