# Split or defer models/configs

`source/lib/models/configs/` has 11 flat `.js` files: `Config.js`, `EmitConfig.js`,
`ExtractionConfig.js`, `FailureConfig.js`, `Link.js`, `LogConfig.js`, `MemoryConfig.js`,
`PageRange.js`, `PaginationConfig.js`, `WebConfig.js`, `WorkersConfig.js`.

This directory is **lowest priority and deferrable**. The files are a cohesive set of peer
value objects with `Config.js` as the root aggregate; nesting them buys little. Only one
small, clean grouping is on the table:

- `pagination/` — `PageRange.js`, `PaginationConfig.js`
- everything else stays flat

## Decision

Judge whether the churn is justified:

- **If splitting**: create `source/lib/models/configs/pagination/`, move `PageRange.js` and
  `PaginationConfig.js` in, fix their relative imports (+1 `../` for outward imports;
  `PaginationConfig` imports `PageRange` as a sibling — stays `./PageRange.js`). Repoint
  importers (verify with `git grep -n -E "configs/(PageRange|PaginationConfig)" source/lib source/spec`;
  `models/response/` and `models/request/` consumers are the likely ones, plus jsdoc refs —
  2 `import('...')` occurrences were found). Move `source/spec/lib/models/configs/PageRange_spec.js`
  and `PaginationConfig_spec.js` into `source/spec/lib/models/configs/pagination/`, fix `../`
  depth. Update `docs/agents/architecture/source-layout.md` `models/configs/` bullet. Validate
  `npm test` / `npm run lint` / `npm run check_docs`.
  Commit: `refactor(models): group pagination configs under models/configs/pagination`.

- **If deferring** (default if the two-file move doesn't clearly improve navigation): make no
  code change. Record the rationale in one line — add it to the `models/configs/` bullet in
  `docs/agents/architecture/source-layout.md` (e.g. "kept flat: cohesive peer value objects
  around the `Config` aggregate; 11 files, no natural sub-domain large enough to warrant a
  folder") and commit just that doc line.
  Commit: `docs(architecture): note models/configs kept flat (issue #812)`.

Either way the acceptance criterion — "`models/configs/` either split or explicitly deferred
with a one-line rationale" — is satisfied.

## Files to Change

Splitting:
- `source/lib/models/configs/{PageRange,PaginationConfig}.js` — **moved** into `pagination/`
- `source/spec/lib/models/configs/{PageRange_spec,PaginationConfig_spec}.js` — **moved** into
  `pagination/`
- importers surfaced by `git grep` (incl. 2 jsdoc `import('...')` refs)
- `docs/agents/architecture/source-layout.md`

Deferring:
- `docs/agents/architecture/source-layout.md` — one-line rationale on the `models/configs/`
  bullet only
