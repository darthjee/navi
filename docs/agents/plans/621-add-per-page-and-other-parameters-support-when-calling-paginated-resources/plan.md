# Plan: Add per_page and other parameters support when calling paginated resources

Issue: [621-add-per-page-and-other-parameters-support-when-calling-paginated-resources.md](../../issues/621-add-per-page-and-other-parameters-support-when-calling-paginated-resources.md)

## Overview

Add a `parameters` field to `paginated_actions` entries (same map syntax `actions` already uses), resolved against the index response and merged into each paginated request's parameters with `page_key` always winning on collision. As part of the same issue, split documentation ownership out of `architect` into a new `docs` specialist agent responsible for user-facing docs (`README.md`, `docs/HOW_TO_USE_NAVI.md`, `docs/navi/*.md`, `DOCKERHUB_DESCRIPTION.md`, `clients/node/README.md`), and use that new agent to document this very feature.

## Architect setup (prerequisite, not delegated)

These are meta/coordination edits to agent definitions themselves — `architect`'s own scope (root-level files, cross-cutting coordination) — done directly before the specialist steps below, since the `docs` agent must exist before its own plan file can be executed.

1. Create `.claude/agents/docs.md`:
   - `name: docs`, `tools: Read, Edit, Write` (no `Bash`).
   - `description`: something like "Navi docs specialist. Use for user-facing documentation — README.md, docs/HOW_TO_USE_NAVI.md, docs/navi/*, DOCKERHUB_DESCRIPTION.md, clients/node/README.md — that lets devs and AI agents consuming Navi use it."
   - Scope section listing exactly: `README.md`, `docs/HOW_TO_USE_NAVI.md`, `docs/navi/*.md`, `DOCKERHUB_DESCRIPTION.md`, `clients/node/README.md`.
   - Explicitly excludes `docs/agents/*`, `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md` (stay with `architect`).
   - Model the tone/structure on the existing `.claude/agents/navi-client.md` (own scope, stack/conventions if any apply, explicit "do NOT touch" boundary).
2. Edit `.claude/agents/architect.md`:
   - Remove `README.md` and `DOCKERHUB_DESCRIPTION.md` from the "Root-level files" scope bullet.
   - Add a `docs` row to the "Specialist agents" table: scope = "user-facing docs: `README.md`, `docs/HOW_TO_USE_NAVI.md`, `docs/navi/*`, `DOCKERHUB_DESCRIPTION.md`, `clients/node/README.md`".
   - Add an explicit coordination rule (e.g. under "How to coordinate"): whenever a task changes user-visible behavior or config surface, delegate the corresponding doc update to `docs`.
3. Edit `.claude/agents/navi-client.md`:
   - Remove `README.md` from its owned-files list, with a short note that it's now owned by `docs`.
4. Update `AGENTS.md` and `docs/agents/architecture.md` only if they enumerate specialist agents by name (check — as of this writing `AGENTS.md` does not list agents; `architect.md` is the only place with the specialist-agents table). If a project-wide agent roster is found elsewhere, add `docs` to it too.

## Agents involved

- [engine](engine.md)
- [docs](docs.md)

## Shared contracts

The YAML config extension and its exact runtime semantics — `engine` implements it, `docs` documents it precisely (including a working example the user can copy):

- New field: `parameters` — a plain map `{ key: pathExpression }`, sibling to `pagination` inside a `paginated_actions` entry. Same syntax and resolution mechanism (`ParametersMapper`/`PathResolver`) as `actions`' `parameters`.
- Resolved against the same response used to compute `pages` (the index response) — not a separate request.
- Merge order for the parameters passed to each paginated `ResourceRequestJob` (weakest to strongest):
  1. Parameters inherited from the parent request (existing behavior, unchanged).
  2. The new `parameters` field's resolved values — overrides same-named inherited parameters.
  3. `page_key`'s page number — always wins, even over a same-named `parameters` entry.
- Error behavior: an unresolved path expression (e.g. a missing header) throws `MissingMappingVariable`, caught by `PaginatedActionProcessingJob`'s existing `try/catch` → `_fail(error)`. `maxRetries` is `1`, so only that one paginated action fails (no pages enqueued for it); it's logged and moved to the dead-letter queue — no retry, no engine crash, no silent skip of the missing parameter.
- Omitting `parameters` entirely must behave exactly as it does today (no regression) — `ParametersMapper`'s existing empty-map fallback (`item.parameters ?? {}`) already guarantees this, since `responseWrapper.parameters` is the same object as the inherited `parameters` already merged in step 1 above.

Example config both sides must keep in sync:

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
