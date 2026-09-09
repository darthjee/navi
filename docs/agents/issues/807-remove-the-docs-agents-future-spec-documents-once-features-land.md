# Issue: Remove the docs/agents/future spec documents once features land

## Description
Part of #794. This is the **cleanup issue** (`CLEAN-1`) for the configurable-menu
/ extension-surface feature set. The specs for that work were written as
throwaway architecture documents under `docs/agents/future/`:
`menu-configuration.md` (SPEC-1/2, #795/#796), `extension-architecture.md`
(SPEC-3/4, #797/#798), `downstream-extension-workflow.md` (SPEC-5, #799), and
`downstream-extension-tests.md` (SPEC-6, #800). They exist only to guide
implementation and are meant to be removed once the features land.

All of #794's implementation issues — IMPL-1 (#801) through IMPL-6 (#806) — are
now merged and closed, so this cleanup is actionable.

## Problem
The permanent docs already link into these transient files as "full
specification" / "design rationale" references:

- `docs/agents/frontend.md` (Extensions section) links to
  `future/extension-architecture.md` `## Frontend`.
- `docs/agents/web-server.md` (extra-routes section) links to
  `future/extension-architecture.md` for the same doc.
- `docs/guides/navi/extending-navi.md` links to
  `future/downstream-extension-workflow.md` (intro) and
  `future/downstream-extension-tests.md` (Testing your extension section).

Deleting the spec files without touching these references leaves dangling
links across two `docs/agents/` pages and one operator-facing guide.

## Expected Behavior
- The four #794 spec files no longer exist under `docs/agents/future/`
  (`docs/agents/future/crawler.md` and `docs/agents/future/crawler/`, which
  belong to an unrelated feature, are untouched).
- `docs/agents/frontend.md`, `docs/agents/web-server.md`, and
  `docs/guides/navi/extending-navi.md` no longer link into the deleted files;
  each stands on its own as the durable reference for the behavior it
  documents.
- No new `docs/agents/` page is created for this — `docs/guides/navi/extending-navi.md`
  is already the comprehensive, working reference for the downstream workflow
  and its Jasmine testing story, so `AGENTS.md`'s documentation table does not
  need a new row.
- Only currently-relevant mechanics missing from the permanent docs are folded
  in; superseded design rationale (rejected alternatives, "deferred/out of
  scope" notes, "why we chose X over Y" writeups) is not migrated — it is
  dropped along with the spec files.
- `grep -rn "docs/agents/future/\(menu-configuration\|extension-architecture\|downstream-extension-workflow\|downstream-extension-tests\)" .` (excluding this issue file itself and its own history) returns nothing.

## Solution
1. For each of the four spec files, skim it against the permanent docs that
   already superseded it (a lot of the mechanics — menu file format,
   `/extensions/*` routes, SPA loader, downstream folder layout, Jasmine
   harness — have already been written into `docs/agents/frontend.md`,
   `docs/agents/web-server.md`, `docs/guides/navi/extending-navi.md`, and
   `docs/guides/navi/configuring-the-menu.md` as part of IMPL-1..6). Fold in
   only mechanics that are still missing. Do **not** carry over design
   rationale (security-model reasoning, rejected alternatives,
   "deferred/out of scope" sections) — it is superseded, not a permanent-doc
   concern.
2. Delete the four files under `docs/agents/future/`.
3. Update the dangling links found above — repoint each at the permanent
   doc/section that now carries the content, or drop the sentence if the
   surrounding text is already self-contained:
   - `docs/agents/frontend.md` extension-architecture.md reference.
   - `docs/agents/web-server.md` extension-architecture.md reference.
   - `docs/guides/navi/extending-navi.md`'s two references
     (`downstream-extension-workflow.md` → point at
     `docs/agents/web-server.md`/`docs/agents/frontend.md`'s extension
     sections instead; `downstream-extension-tests.md` → point at
     `docs/agents/frontend.md`'s test-harness coverage, or drop the link if
     the guide's own "Testing your extension" section is already
     self-contained).
   No new `docs/agents/` page is created — `extending-navi.md` remains the
   single downstream-facing reference.
4. Confirm no remaining references point at the deleted files anywhere in the
   repo (`grep -rn` across `docs/`, `AGENTS.md`).
5. `AGENTS.md`'s documentation table already lists `docs/agents/future/`
   generically and stays valid as-is (`crawler.md` remains there); no table
   change is needed for this issue.

## Benefits
- Removes stale, superseded design documents from the repo.
- Eliminates dangling links left behind after the specs are deleted.
- Keeps the permanent docs (`docs/agents/`, `docs/guides/`) as the single
  source of truth for the shipped menu/extension behavior.
