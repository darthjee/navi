# Architect Plan: Docs: module-level README indexes + move the config schema out of README (token efficiency)

Main plan: [plan.md](plan.md)

## Shared contracts

- `engine` / `worker` / `frontend` create the co-located index files
  `source/lib/README.md`, `worker/lib/README.md`, `frontend/src/README.md` respectively.
  This agent adds the **reverse** links from the `docs/agents/` pages and records the new
  convention in `AGENTS.md`.
- Back-links to add (relative paths, from each `docs/agents/` file):
  | Page | Link target |
  |---|---|
  | `docs/agents/architecture/source-layout.md` | `../../../source/lib/README.md` |
  | `docs/agents/worker.md` | `../../worker/lib/README.md` |
  | `docs/agents/frontend.md` | `../../frontend/src/README.md` |
- `docs` owns `README.md`, `DOCKERHUB_DESCRIPTION.md`, and everything under `docs/guides/` —
  do not touch those. This agent's Part-2 involvement is none; this file is Part 1 only.

## Implementation Steps

### Step 1 — Add back-links from the `docs/agents/` pages

Add a short pointer near the top of each page (e.g. a note line under the intro, or a row
in the page's existing table) telling the reader a co-located index exists in the tree:

- **`docs/agents/architecture/source-layout.md`** — under `## Source Code Layout`, add:
  `> A co-located [`source/lib/README.md`](../../../source/lib/README.md) gives a one-line index of each immediate subfolder; this page is the full breakdown.`
- **`docs/agents/worker.md`** — under `## Overview`, add:
  `> [`worker/lib/README.md`](../../worker/lib/README.md) is a one-line index of `worker/lib/`'s immediate subfolders; this page is the class-by-class reference.`
- **`docs/agents/frontend.md`** — under the intro / `## Source layout`, add:
  `> [`frontend/src/README.md`](../../frontend/src/README.md) is a one-line index of `frontend/src/`'s immediate children; this page is the full reference.`

Match each file's existing tone; keep it to one line.

### Step 2 — Record the convention in `AGENTS.md`

In `AGENTS.md`, under the `## Documentation` section (after the `### Future` subsection),
add a short subsection:

```markdown
### Module-level READMEs

The large source trees carry a co-located `README.md` that indexes their immediate
children in one line each and links to the fuller `docs/agents/` page:

| Tree | Index | Full reference |
|------|-------|----------------|
| `source/lib/` | [`source/lib/README.md`](source/lib/README.md) | [`docs/agents/architecture/source-layout.md`](docs/agents/architecture/source-layout.md) |
| `worker/lib/` | [`worker/lib/README.md`](worker/lib/README.md) | [`docs/agents/worker.md`](docs/agents/worker.md) |
| `frontend/src/` | [`frontend/src/README.md`](frontend/src/README.md) | [`docs/agents/frontend.md`](docs/agents/frontend.md) |

These indexes stay terse — new narrative goes in the `docs/agents/` page, not the README.
```

## Files to Change

- `docs/agents/architecture/source-layout.md` — add a one-line pointer to `source/lib/README.md`
- `docs/agents/worker.md` — add a one-line pointer to `worker/lib/README.md`
- `docs/agents/frontend.md` — add a one-line pointer to `frontend/src/README.md`
- `AGENTS.md` — add a `### Module-level READMEs` subsection under `## Documentation`

## CI Checks

None. `docs/agents/**` and `AGENTS.md` changes trigger no CI job.

## Notes

- Do the back-link edits only after (or in coordination with) the three specialists
  creating the target files, so the links resolve. If sequencing isn't possible, the paths
  are fixed and known (see the table above) — the links can be written first.
- Keep the `docs/agents/` narrative single-sourced: the new READMEs link here, not the
  other way around for content — these pointers are navigational only.
