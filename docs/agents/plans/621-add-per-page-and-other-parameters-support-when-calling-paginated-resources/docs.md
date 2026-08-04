# Docs Plan: Add per_page and other parameters support when calling paginated resources

Main plan: [plan.md](plan.md)

This plan assumes the `docs` agent already exists — it is created by `architect` as a prerequisite step (see [plan.md](plan.md)'s "Architect setup" section) before this plan runs.

## Shared contracts

Document exactly the `parameters` field, merge order, and error behavior described in [plan.md](plan.md)'s "Shared contracts" section — this is what `engine` implements. Use the same example config in every doc location so it can be copy-pasted consistently.

## Implementation Steps

### Step 1 — `docs/navi/paginated-actions.md`

This is the canonical, detailed doc for the feature. Add a `parameters` bullet alongside the existing `pages`/`page_key`/`zero_indexed` list (currently lines 8-11), documenting:

- Plain map `{ key: pathExpression }`, same syntax as `actions`' `parameters`.
- Resolved against the same response used for `pages`.
- Merge order: parent-inherited parameters < `parameters` < `page_key` (always wins).
- What happens when a path expression doesn't resolve (fails the paginated action in isolation, no retry, logged — cross-reference the existing `actions` error-handling behavior if a comparable doc section exists for it).

Extend the existing example (currently lines 17-31) to include a `parameters: { per_page: headers['x-per-page'] }` entry and update the explanatory paragraph below it (currently line 33) to mention the extra parameter flowing into the target URL.

### Step 2 — `docs/navi/prerequisites.md`

Add rows to the config field reference table (near the existing `paginated_actions[].pagination[].*` rows, currently lines 79-84):

```
| `paginated_actions[].parameters` | Optional. Path expressions (same syntax as `actions[].parameters`) resolved against the response and merged into each page's request parameters. `page_key`'s value always takes precedence on key collision. |
```

### Step 3 — Root `README.md`

Two spots need updating:

- The `paginated_actions[].*` field table (currently around lines 150-155) — add a `paginated_actions[].parameters` row, same wording as Step 2.
- The "Paginated Actions" narrative section (currently lines 315-347) — add `parameters` to the bullet list describing each `pagination_action` entry, update the merge-order sentence (currently line 325, which only mentions the page parameter merging with inherited parameters), and extend the YAML example (currently lines 331-345) with a `parameters:` entry plus a sentence noting the resolved value in the explanation below it (currently line 347).

### Step 4 — `docs/HOW_TO_USE_NAVI.md`

No content change expected — it is a table-of-contents/index page; the "Paginated Actions" link description (`Fanning out one request per page with paginated_actions`) already covers this without needing the new field spelled out. Confirm this assumption still holds once Steps 1-3 land (i.e. the description doesn't become misleading), and only touch it if it does.

### Step 5 — `clients/node/README.md`

Check whether it documents `paginated_actions` at all (it wraps the `/api/*` HTTP namespace, not config authoring, so it likely doesn't). If it does, apply the same update as Step 3; otherwise, no change needed here — this step exists only to confirm, not to force an edit.

## Files to Change

- `docs/navi/paginated-actions.md` — add `parameters`, merge order, and error-handling documentation; extend the example.
- `docs/navi/prerequisites.md` — add `paginated_actions[].parameters` field table row.
- `README.md` — add the field table row and update the narrative "Paginated Actions" section + example.
- `clients/node/README.md` — only if it turns out to reference `paginated_actions` (see Step 5).

## Notes

- `source/README.md` is **not** in this agent's scope for this issue — it lives inside `source/` and stays with `engine` by folder-based ownership (the issue's decided `docs` scope didn't carve it out, unlike `clients/node/README.md` which was explicitly moved). `engine.md`'s plan covers updating it so the npm-published package readme doesn't go stale. Flag to `architect` if this split ever feels wrong in practice — future issues may want to move `source/README.md` into `docs` too, but that's out of scope here.
- Keep all four/five doc locations (`docs/navi/paginated-actions.md`, `docs/navi/prerequisites.md`, root `README.md`, `source/README.md`, possibly `clients/node/README.md`) using the *same* example (`per_page: headers['x-per-page']`) so a reader jumping between them doesn't see conflicting syntax.
