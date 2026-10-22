# Plan: Create the docs/agents/specs.md hub for all spec files

Issue: [978-create-the-docs-agents-specs-md-hub-for-all-spec-files.md](../../issues/978-create-the-docs-agents-specs-md-hub-for-all-spec-files.md)

## Overview

Docs-only change, owned by the architect (`docs/agents/` and `AGENTS.md` are outside every specialist's scope). Create `docs/agents/specs.md` as the permanent hub for all spec files, move the spec conventions from `AGENTS.md` into it, and point `AGENTS.md` at the hub.

## Context

Specs of not-yet-implemented work live under `docs/agents/specs/`. Today there is only the crawler spec (`specs/crawler.md` + `specs/crawler/`). `AGENTS.md` links the folder directly (docs-table row, line 33) and carries the conventions inline (`### Specs (docs/agents/specs/)`, lines 55–69). This is part of epic #977: the release spec (#979) will register itself in this hub, and #980 will remove it again.

## Implementation Steps

### Step 1 — Create `docs/agents/specs.md`

Follow the existing hub shape (`docs/agents/architecture.md`: `# Title`, a one-line intro, then a `| Topic | Description |` table):

- `# Specs` heading, then a short intro: specs are guidelines for planned-but-not-yet-implemented work. Each spec is removed once its work is implemented and documented in its permanent place. This hub is permanent.
- A `## Conventions` section holding the rules moved from `AGENTS.md`:
  - One file per topic: `docs/agents/specs/<topic>.md`.
  - If it grows too large, split it into a hub plus subfolder (example: `specs/crawler.md` + `specs/crawler/`), the same pattern as `architecture.md`, `flow.md` and `contributing.md`.
  - Remove the spec once the feature is implemented and documented. The `docs/agents/specs/` folder itself is permanent.
  - **New rule:** every new spec must add a row to the table below, and the row is removed when the spec is deleted.
  - The hub links only each spec's top-level `<topic>.md`, never its subfiles; a split spec's own hub lists its topic files.
  - When no specs exist, the table is replaced by the line `_No specs at the moment._`.
- A `## Specs` section with a `| Spec | Description |` table, currently one row:
  `| [Crawler](specs/crawler.md) | Information crawling & data emission (incomplete design). |`

### Step 2 — Update `AGENTS.md`

- Docs table (line 33): change the row's link from `docs/agents/specs/` to `docs/agents/specs.md`, keeping the description.
- `### Specs (docs/agents/specs/)` section (lines 55–69): replace the body with a short pointer, e.g. "Specs of not-yet-implemented work live under `docs/agents/specs/`. See [docs/agents/specs.md](docs/agents/specs.md) for the list of specs and the conventions (file layout, hub split, add/remove-from-hub rule, removal after implementation)." The conventions are no longer repeated here.

## Files to Change

- `docs/agents/specs.md` — new hub: intro, conventions, specs table.
- `AGENTS.md` — docs-table link to the hub; Specs section reduced to a pointer.

## Notes

- No change to the crawler spec content, and no files are moved or renamed, so existing links keep working.
- The release spec row is **not** added here; #979 adds it.
- Known out-of-scope risk: `README.md:483` links to `docs/agents/specs/crawler/flows.md` and will break when the crawler spec is eventually removed.
- Verification: docs only. Check that the relative links resolve (`specs.md` → `specs/crawler.md`, `AGENTS.md` → `docs/agents/specs.md`). No CI job covers `docs/agents/`.
