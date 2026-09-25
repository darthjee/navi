# Engine Plan: Reduce the size of ResourceRequestPaginatedAction_spec.js

Main plan: [plan.md](plan.md)

## Overview
`source/spec/lib/models/request/resource_request/ResourceRequestPaginatedAction_spec.js` is 383 lines, and the spec size check reports it as WARN. Split it into three files, named with the `<Class>_<topic>_spec.js` pattern used by sibling splits (`ResourceRequest_url_spec.js`, `ResourceRequestEmit_resolveBody_spec.js`, `Client_emit_spec.js`):

- `ResourceRequestPaginatedAction_spec.js`: `constructor`, `.fromList`, and the core `#execute` cases (pagination variants, multiple requests, `maxPage`, disabled requests, errors, stopped application). This should end up at about 220 lines.
- `ResourceRequestPaginatedAction_parameters_spec.js`: `#execute` → `parameters`.
- `ResourceRequestPaginatedAction_namespace_spec.js`: `#execute` → `namespace resolution`.

## Context
All three files need the same module-level constants (`pagination`, `responseWrapper`) and the `registerProductsResource` helper. `ResourceActionUtils.setup()` already provides the logger, `JobRegistry` and `NamespaceMap` setup and teardown. To avoid copying the constants three times, move them into a new support util.

## Steps

- [01 — Extract shared paginated-action spec helpers](engine/01-extract-shared-helpers.md)
- [02 — Move the parameters block to its own spec](engine/02-parameters-spec.md)
- [03 — Move the namespace resolution block to its own spec and trim the main spec](engine/03-namespace-spec-and-trim.md)

## CI Checks
- `source`: `yarn spec` (CI job: `jasmine`)
- `source`: `yarn lint` (CI job: `checks`)

## Notes
- Do not add, remove or reword any `it` case. Every existing assertion must still run exactly once across the three files. Count the specs before and after to confirm, for example with `npx jasmine <files>`.
- Each new file needs its own `ResourceActionUtils.setup()` call inside its top-level `describe`, because the setup/teardown hooks are registered per `describe`.
- Keep the outer `describe('ResourceRequestPaginatedAction')` → `describe('#execute')` nesting in the new files so reported spec names stay the same.
- After the split, check the line count of each file (`wc -l`). All of them must be under 300.
