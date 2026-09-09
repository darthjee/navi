# Docs Plan: Remove the docs/agents/future spec documents once features land

Main plan: [plan.md](plan.md)

## Shared contracts

Point both links below at the section `architect` leaves in
`docs/agents/frontend.md` (`## Extensions`) and `docs/agents/web-server.md`
(extra-routes section) — not at line numbers, which may shift once `architect`
folds in any missing mechanics.

## Implementation Steps

### Step 1 — Fix the intro paragraph's dangling link

In `docs/guides/navi/extending-navi.md`, the intro paragraph reads:

> This page is the operator-facing walkthrough. For the container-side loader
> mechanics (what Navi scans, how descriptors are validated, collision
> handling), see the extension architecture design doc:
> [`downstream-extension-workflow.md`](../../agents/future/downstream-extension-workflow.md).
> To run your extension's own test suite, see
> [Testing your extension](#testing-your-extension).

Repoint the link at `docs/agents/web-server.md`'s extra-routes section (backend
loader mechanics) and `docs/agents/frontend.md`'s `## Extensions` section
(frontend loader mechanics) — or drop that middle sentence entirely if the rest
of this guide (folder layout, registration, build/serve story) is already
self-contained without a "see also" pointer.

### Step 2 — Fix the "Testing your extension" section's dangling link

Further down, the "Testing your extension" section ends with:

> The design rationale (discovery, isolation, the promoted double set) lives in
> [`downstream-extension-tests.md`](../../agents/future/downstream-extension-tests.md);
> this section is the durable operator/author reference.

Since that file is deleted, drop the sentence (the section already states it is
"the durable operator/author reference") or repoint it at wherever
`docs/agents/frontend.md`/`docs/agents/web-server.md` documents the Jasmine
test-harness mechanics added by IMPL-6 (#806), if such a section exists.

## Files to Change

- `docs/guides/navi/extending-navi.md` — fix both dangling links (intro
  paragraph and "Testing your extension" section).

## Notes

- Wait for `architect`'s Step 3 (frontend.md/web-server.md link cleanup) to
  land first, or coordinate on the exact section names, since this file's
  links should reference those sections by name.
