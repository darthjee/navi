# Issue: Refactor: split oversized flat directories under source/lib/

## Description

An automated token-efficiency review flagged `source/lib/` as a flat 20+ file directory.
That claim is stale: `source/lib/` already has zero flat files and ~45 sub-folders, and
`jobs/`, `parsers/`, `server/`, `services/config/`, `utils/logging/` already exist. This repo
has run that reorg before (#527, #723, #432).

The real problem is one level deeper: a handful of *leaf* directories have grown large enough
that finding related code means scanning a long flat listing — a navigation and
token-efficiency cost for both agents and people.

Owning agent: **engine** — all changes are confined to `source/lib/**` and `source/spec/lib/**`.

## Problem

Oversized leaf directories today:

| Directory | Flat `.js` files |
|---|---|
| `source/lib/exceptions/config/` | 19 |
| `source/lib/registry/` | 14 |
| `source/lib/models/request/` | 12 |
| `source/lib/models/configs/` | 11 |
| `source/lib/common/utils/logging/` | 11 (real implementation) |

`source/lib/utils/logging/` is **not** accidental duplication — it is a pure re-export barrel
layer: all 11 files are one-liners of the form
`export * from '../../common/utils/logging/<Name>.js';`. The real implementation lives in
`source/lib/common/utils/logging/`. Roughly 25 call sites (12 files under `source/lib/`, plus
spec and support files) import through the stale barrel path. The logging specs currently
exist only at `source/spec/lib/utils/logging/` (11 files); there is no
`source/spec/lib/common/utils/logging/` yet.

Per the contributing guide and the clean-move style of #527 / #723, compatibility re-export
barrels are not kept — the barrel layer is removed outright as part of this work.

## Solution

Break each directory below into sub-domain folders, following existing repo convention
(lowercase / snake_case folder names; a few cohesive peer files may stay flat at the parent).
Move the mirrored `source/spec/lib/...` tree in lockstep. Proposed groupings — the planner
may refine:

### `source/lib/exceptions/config/` (19)
- `emit/` — `InvalidEmitBodyTemplate`, `InvalidEmitCooldown`, `InvalidEmitHeaders`, `InvalidEmitMethod`, `InvalidEmitRetries`, `MissingEmitUrl`
- `parser/` — `InvalidParserMatch`, `InvalidParserType`, `MissingParserField`, `MissingParserFields`, `MissingParserMatch`
- `memory/` — `InvalidMemoryDataStore`, `InvalidMemoryThresholds`
- `file/` — `ConfigurationFileNotFound`, `ConfigurationFileNotProvided`, `ConfigurationIncludeNotFound`
- stay flat — `MissingClientsConfig`, `MissingResourceConfig`, `MissingTopLevelConfgKey` (existing "Confg" typo left as-is unless trivially fixed)

### `source/lib/registry/` (14)
- `instances/` — `EmissionRegistryInstance`, `ExtractionRegistryInstance`, `LogRegistryInstance`, `MemoryRegistryInstance`
- `namespace/` — `Namespace`, `NamespaceMap`, `NamedRegistry`
- stay flat — `ClientRegistry`, `EmissionRegistry`, `ExtractionRegistry`, `LogRegistry`, `MemoryRegistry`, `ParserRegistry`, `ResourceRegistry`

### `source/lib/models/request/` (12)
- `resource_request/` — `ResourceRequest`, `ResourceRequestAction`, `ResourceRequestEmit`, `ResourceRequestPaginatedAction`, `ResourceRequestParser`
- `renderers/` — `BodyTemplateRenderer`, `TemplateStringRenderer`
- `tokens/` — `TokenResolver`, `UrlTokenResolver`
- stay flat — `AssetRequest`, `ClientReference`, `Resource`

### `source/lib/models/configs/` (11) — lowest priority, deferrable
- `pagination/` — `PageRange`, `PaginationConfig`
- leave the rest flat (cohesive peer value objects; `Config` is the root aggregate). The
  planner may defer this directory entirely with a one-line rationale if the churn isn't
  justified.

### Logging — remove the barrel layer, then sub-group the real dir
1. Delete all 11 files in `source/lib/utils/logging/` and the now-empty directory. Do **not**
   replace them with anything.
2. Repoint every `import` / `export` / jsdoc `import('...')` reference from
   `.../utils/logging/<Name>.js` to the corresponding `.../common/utils/logging/<Name>.js`
   (~25 call sites across `source/lib/` and `source/spec/`).
3. Move the 11 spec files from `source/spec/lib/utils/logging/` to
   `source/spec/lib/common/utils/logging/`, fixing their relative import depth.
4. Sub-group the now-consolidated `source/lib/common/utils/logging/` (11 flat files), e.g.
   `buffer/` (`BufferedLogger`, `LogBuffer`, `LogBufferCollection`) with `Logger`,
   `LoggerGroup`, `LogFactory`, `Log`, `LogContext`, `LogFilter`, `BaseLogger`,
   `ConsoleLogger` staying flat. Mirror under `source/spec/lib/common/utils/logging/`.

### For every move
- Update all `import`/`export` relative paths at call sites (no path alias — each site edited;
  do **not** add compatibility re-export barrels, match the clean-move style of #527 / #723).
- Update the moved files' own relative imports (each gains/loses a `../`).
- Update jsdoc `@param {import('...')}` comment paths.
- Create the mirrored folders under `source/spec/lib/...` and move the `*_spec.js` files.
- Keep commits atomic per the contributing guide — ideally one commit per directory.

### Validation
- `cd source && npm run lint` (`eslint lib spec`) — clean
- `cd source && npm test` (jasmine) — all green
- `cd source && npm run check_docs` — no pedantic jsdoc path failures
- `git grep -n "exceptions/config/" source/lib source/spec` (and equivalents for the other
  moved dirs) returns only updated paths
- `git grep -n "utils/logging/" source/lib source/spec` returns only `common/utils/logging/` paths
- No file remains that references an old path

### Acceptance criteria
- [ ] `source/lib/exceptions/config/`, `registry/`, `models/request/` each split into
      sub-domain folders; largest resulting flat listing in each is materially smaller
- [ ] `source/spec/lib/**` mirrors the new structure exactly
- [ ] `source/lib/utils/logging/` barrel layer deleted; all call sites import from
      `source/lib/common/utils/logging/`; logging specs relocated to
      `source/spec/lib/common/utils/logging/`
- [ ] `source/lib/common/utils/logging/` sub-grouped (e.g. `buffer/`), spec tree mirrored
- [ ] `models/configs/` either split or explicitly deferred with a one-line rationale
- [ ] All jsdoc `import('...')` refs updated; `npm run check_docs` passes
- [ ] `npm test` and `npm run lint` pass with no path-related failures
- [ ] No compatibility shim / re-export barrel left behind at an old path

## Benefits

- Shorter flat directory listings — less scanning and lower token cost for agents and people
  navigating `source/lib/`.
- Removes 11 stale re-export barrel files outright and eliminates a confusing second import
  path for the logging subsystem.
- The spec tree mirrors the real implementation location, so tests are found where the code is.
- Consistent with the sub-domain-folder convention already established by #527 / #723 / #432.
