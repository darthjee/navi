# Spec-support Plan: Reduce Codacy duplication in dev frontend page and client specs

Main plan: [plan.md](plan.md)

## Shared contracts

Produces `navi-spec-support/fetch.js` exactly as specified in [plan.md](plan.md#shared-contracts): `stubFetchSuccess(data, headers?)`, `mockFetchSuccess(data, headers?)`, `mockFetchFailure(status)`, `mockFetchPending()`, `paginationHeaders({ page, pageSize, pages })`. Nothing is consumed from other agents.

## Implementation Steps

### Step 1 — Add `spec-support/fetch.js`
Create `spec-support/fetch.js` with the five exports above, modelled on `frontend/spec/support/fetch.js` (same names and one-argument behaviour for `stubFetchSuccess`/`mockFetchSuccess`/`mockFetchFailure`), extended with the optional `headers` argument, `mockFetchPending` (`new Promise(noop)` semantics, but do not import `noop`: the package keeps each helper self-contained, so use an inline never-resolving promise) and `paginationHeaders`. Keep the file dependency-free and use the same `// comment` style as `dom.js`/`async.js`.

### Step 2 — Register and document the new subpath
Add `"./fetch.js": "./fetch.js"` to `exports` in `spec-support/package.json` and a row for `navi-spec-support/fetch.js` to the table in `spec-support/README.md`. Update the public-subpath table in `.claude/agents/spec-support.md` (scope bullet list and `## The exports contract` table) and the same summary in `docs/agents/spec-support.md`, and add `fetch` to the agent `description` where it lists the helpers.

## Files to Change
- `spec-support/fetch.js` — new module with the fetch stubs and `paginationHeaders`
- `spec-support/package.json` — add the `./fetch.js` export
- `spec-support/README.md` — document the new subpath
- `.claude/agents/spec-support.md` — scope list, exports table and description
- `docs/agents/spec-support.md` — describe the new helper

## CI Checks
- `spec-support`: no suite of its own; exercised by the consumers' specs (CI jobs: `jasmine-dev-frontend`, `jasmine-frontend`). After editing, run `yarn install` in `dev/frontend/` (and `frontend/`) so the `file:` snapshot is refreshed before running their specs.

## Notes
- Do not migrate `frontend/spec/support/fetch.js` or touch `dockerfiles/navi-hey-test/Dockerfile` (the image copies the frontend `fetch.js` verbatim); that migration is a separate follow-up issue.
- The `.claude/agents/` and `docs/agents/` edits are documentation only; whoever orchestrates the plan (architect) can apply them if the specialist's scope excludes those paths.
