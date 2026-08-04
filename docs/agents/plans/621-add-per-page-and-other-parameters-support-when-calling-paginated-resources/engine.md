# Engine Plan: Add per_page and other parameters support when calling paginated resources

Main plan: [plan.md](plan.md)

## Shared contracts

Implement exactly the `parameters` field, merge order, and error behavior described in [plan.md](plan.md)'s "Shared contracts" section — `docs` will document this contract as written here, so any deviation must be reflected back in `plan.md` first.

## Implementation Steps

### Step 1 — Add `parameters` support to `ResourceRequestPaginatedAction`

In `source/lib/models/request/ResourceRequestPaginatedAction.js`:

- Import `ParametersMapper` from `../response/ParametersMapper.js` (already used by `ResourceRequestAction.js` — same pattern).
- Add a `#mapper` private field, constructed in the constructor: `this.#mapper = new ParametersMapper(parameters);` where `parameters = {}` is a new destructured constructor argument (naming collision note: the constructor already receives no `parameters` today — the existing `parameters` name used elsewhere in this file refers to the *execute-time* argument, a different thing; pick clear internal naming, e.g. keep the constructor param named `parameters` matching the YAML key exactly like `ResourceRequestAction` does, since there's no ambiguity within the constructor's own parameter list).
- Update the JSDoc `@param` block to document the new `attributes.parameters` argument, mirroring `ResourceRequestAction`'s existing doc for the same field.

### Step 2 — Update `execute()`'s merge order

Change:

```js
const pageParameters = { ...parameters, [this.#pagination.pageKey]: page };
```

to:

```js
const pageParameters = {
  ...parameters,
  ...this.#mapper.map(responseWrapper),
  [this.#pagination.pageKey]: page,
};
```

`this.#mapper.map(responseWrapper)` is resolved once per `execute()` call (outside the `for (const page of pages)` loop), not per page — its result doesn't depend on the page number, only on the response, so hoist it before the loop for clarity/efficiency (matching how `resolvePages`/`getResource` are already computed once above the loop).

### Step 3 — Specs

Extend `source/spec/lib/models/request/ResourceRequestPaginatedAction_spec.js`:

- A case where `parameters` is configured and the resolved values appear in every enqueued job's parameters, per page.
- A case proving `parameters` overrides same-named inherited parent parameters (merge precedence, weakest position).
- A case proving `page_key`'s value always wins over a same-named `parameters` entry (merge precedence, strongest position).
- A case proving omitting `parameters` entirely behaves exactly as today (regression guard for the `ParametersMapper` empty-map fallback noted in `plan.md`).
- A case where an unresolved path expression in `parameters` throws `MissingMappingVariable` — mirror the existing `'throws MissingMappingVariable when the pages path is missing'` test right above it.

No changes expected to `PaginationConfig.js`, `PaginationConfig_spec.js`, `PaginatedActionProcessingJob.js`, or `ParametersMapper.js` — the feature is implemented purely by reusing `ParametersMapper` inside `ResourceRequestPaginatedAction`, and error propagation already works via the existing job `try/catch`.

### Step 4 — `source/README.md` (npm-published package readme)

This file lives inside `source/`, so it stays with `engine` rather than moving to the new `docs` agent (see `docs.md`'s Notes — the issue's decided `docs` scope only explicitly carved out `clients/node/README.md`, not this one). It currently duplicates the same two spots as the root `README.md`:

- The `paginated_actions[].*` field table — add a `paginated_actions[].parameters` row: same wording as the root `README.md`'s new row (see `docs.md` Step 2/3).
- The "Paginated Actions" narrative section and its YAML example — add `parameters` to the bullet list, update the merge-order sentence, and extend the example with `parameters: { per_page: headers['x-per-page'] }`, matching `docs.md` Step 1/3's wording exactly so all doc locations stay consistent.

## Files to Change

- `source/lib/models/request/ResourceRequestPaginatedAction.js` — add `parameters` constructor argument, `#mapper`, and merge it into `pageParameters` in `execute()`.
- `source/spec/lib/models/request/ResourceRequestPaginatedAction_spec.js` — add the cases listed in Step 3.
- `source/README.md` — add the field table row and update the narrative "Paginated Actions" section + example (Step 4).

## CI Checks

- `source`: `cd source && yarn install && npm run coverage` (CI job: `run-source-tests`)
- `source`: `cd source && yarn install && npm run lint && npm run report` (CI job: `lint-source`)

## Notes

- Keep the constructor's new `parameters` default as `{}` (matching `ResourceRequestAction`'s default) so existing YAML configs without the field need no changes.
- Double-check `ParametersMapper`'s empty-map fallback (`item.parameters ?? {}`) really does resolve to the same values already present in the inherited `parameters` argument for every existing test case — this is asserted by the new regression-guard spec in Step 3, not just assumed.
