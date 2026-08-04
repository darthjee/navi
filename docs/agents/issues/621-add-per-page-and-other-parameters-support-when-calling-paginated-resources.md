# Issue: Add per_page and other parameters support when calling paginated resources

## Description

Navi's `paginated_actions` fan out one request per page using a `pages` expression resolved from the response, injecting only the page number (via `page_key`) into each downstream request. There is currently no way to extract additional dynamic values from that same response — e.g. a `per_page` value returned in a response header — and pass them along to the paginated resource requests.

## Problem

When an index endpoint reports pagination metadata beyond just the page count (e.g. `per_page` in a response header), that information is lost: `paginated_actions` only support `pages`, `page_key`, and `zero_indexed` in their `pagination` block, and the parameters passed to each paginated request are just the page number merged with parameters inherited from the parent request — nothing extracted fresh from the index response (unlike `actions`, which already support this via a `parameters` map). Users are forced to hardcode values like `per_page` statically rather than deriving them from the actual server response.

## Expected Behavior

`paginated_actions` entries can declare a `parameters` map (same syntax as `actions`' `parameters`), resolved via path expressions against the same response used to compute `pages`. Its resolved values are merged into each paginated request's parameters, with `page_key`'s value always taking final precedence on key collisions. Docs (`docs/navi/paginated-actions.md`, and `HOW_TO_USE_NAVI.md`/`README.md` where relevant) reflect the new field.

## Solution

1. **YAML field** — add a `parameters` field (plain map `{ key: pathExpression }`) as a sibling of `pagination` on each `paginated_actions` entry, reusing the existing `ParametersMapper`/`PathResolver` machinery (same as `actions`) — no new resolver logic.

   ```yaml
   paginated_actions:
     - resource: products_page
       pagination:
         - pages: parsedBody.pagination.pages
         - page_key: page
         - zero_indexed: false
       parameters:
         per_page: headers['x-per-page']
   ```

   Resolved against the same `responseWrapper` already used for `pages` — not a separate fetch. `ResourceRequestPaginatedAction` gains a `#mapper = new ParametersMapper(parameters)` field mirroring `ResourceRequestAction`, and `execute()` calls `this.#mapper.map(responseWrapper)` to get the extra values.

   Caveat for the implementer: `ParametersMapper.map()` falls back to `item.parameters ?? {}` when no `parameters` map was configured. Since `responseWrapper.parameters` is built from the exact same `parameters` object already spread into `pageParameters` (see merge order below), this fallback is redundant but harmless when `parameters` is omitted — existing configs without the new field keep behaving exactly as they do today. Worth a regression test covering that specific "no `parameters` field" case.

2. **Merge/precedence** — merge order, weakest to strongest:

   ```js
   const pageParameters = {
     ...parameters,                          // inherited from the parent request (existing behavior)
     ...this.#mapper.map(responseWrapper),   // new `parameters:` field
     [this.#pagination.pageKey]: page,       // pagination's page number always wins
   };
   ```

   The new `parameters` field overrides same-named inherited parent parameters; `page_key` always wins over everything, even an accidental collision.

3. **Error handling** — no special-casing: an unresolved path expression throws `MissingMappingVariable`, uncaught through `execute()`, caught by `PaginatedActionProcessingJob.perform()`'s existing `try/catch` → `_fail(error)`. `maxRetries` is already `1`, so the paginated action fails in isolation (no pages enqueued for it), is logged, and goes straight to the dead-letter queue — no retry, no crash of the engine, no silent fallback.

4. **New `docs` specialist agent** — introduce a `.claude/agents/docs.md` responsible for Navi's user-facing documentation (as opposed to `docs/agents/`, which documents Navi's internals for contributors):
   - Scope: `README.md`, `docs/HOW_TO_USE_NAVI.md` + the full `docs/navi/*.md` tree, `DOCKERHUB_DESCRIPTION.md`, and `clients/node/README.md` (ownership moves here from `navi-client`).
   - Tools: `Read, Edit, Write` (no `Bash`).
   - Excluded (stays with `architect`): `docs/agents/*`, `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`.
   - Update `architect.md`: drop `README.md`/`DOCKERHUB_DESCRIPTION.md` from its scope, add `docs` to the specialist agents table, and add a coordination rule — whenever a task changes user-visible behavior or config surface, delegate the corresponding doc update to `docs`.
   - Update `navi-client.md`: remove `README.md` from its scope, noting it's now owned by `docs`.
   - This issue's own doc update (`docs/navi/paginated-actions.md`, and `HOW_TO_USE_NAVI.md`/`README.md` if relevant) is the first task delegated to the new `docs` agent, exercising the new coordination rule end to end.

## Benefits

- Lets `paginated_actions` propagate any server-reported metadata (e.g. `per_page`) into downstream paginated requests, without hardcoding.
- Reuses existing, already-tested infrastructure (`ParametersMapper`/`PathResolver`, `MissingMappingVariable` error handling) — minimal new code.
- Establishes a durable separation between contributor-facing docs (`docs/agents/`, owned by `architect`) and user-facing docs (`README.md`, `docs/HOW_TO_USE_NAVI.md`, owned by the new `docs` agent), with an explicit coordination rule that keeps future user-visible changes from leaving docs stale.
