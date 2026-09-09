# Architect Plan: Remove the docs/agents/future spec documents once features land

Main plan: [plan.md](plan.md)

## Shared contracts

Your edits to `docs/agents/frontend.md` and `docs/agents/web-server.md` are what
`docs`'s link fixes in `docs/guides/navi/extending-navi.md` will point at — leave
each doc's extension coverage as a clearly identifiable section (e.g. keep the
existing `## Extensions` heading in `frontend.md`) so `docs` can reference it by
name rather than by line number.

## Implementation Steps

### Step 1 — Audit the specs against the permanent docs

For each of the four files under `docs/agents/future/` —
`menu-configuration.md` (SPEC-1/2), `extension-architecture.md` (SPEC-3/4),
`downstream-extension-workflow.md` (SPEC-5), `downstream-extension-tests.md`
(SPEC-6) — check whether its mechanics (not its design rationale) are already
covered by `docs/agents/frontend.md`'s `## Extensions` section,
`docs/agents/web-server.md`'s extra-routes section, and
`docs/guides/navi/configuring-the-menu.md`. Note in-session, do not commit
separately, anything genuinely missing so it can be folded in during Step 2. Do
**not** carry over rejected alternatives, "Strategy decision", "Security model"
reasoning, or "Deferred / out of scope" notes — those are now moot.

### Step 2 — Fold in missing mechanics and delete the spec files

Edit `docs/agents/frontend.md` and/or `docs/agents/web-server.md` to add any
mechanics identified as missing in Step 1 (expected to be little or nothing,
since IMPL-1..6 already documented most of this as they landed). Then delete:

- `docs/agents/future/menu-configuration.md`
- `docs/agents/future/extension-architecture.md`
- `docs/agents/future/downstream-extension-workflow.md`
- `docs/agents/future/downstream-extension-tests.md`

Leave `docs/agents/future/crawler.md` and `docs/agents/future/crawler/`
untouched — unrelated feature.

### Step 3 — Fix the dangling links in frontend.md and web-server.md

- `docs/agents/frontend.md`'s `## Extensions` section ends with a sentence
  linking to `[`docs/agents/future/extension-architecture.md`](future/extension-architecture.md)
  `## Frontend` "for the full specification". Since that file is now deleted,
  either drop the trailing clause (the section already documents the loader
  steps, bundle contract, and single-React-instance mechanism in full) or
  rephrase the sentence to stop referencing it.
- `docs/agents/web-server.md`'s extra-routes section has the same pattern,
  ending with a link to `docs/agents/future/extension-architecture.md`
  `## Frontend` "for the full specification" — apply the same fix (this doc
  already documents the `/extensions/*` route handlers and `ExtensionsEnv`
  in full).

## Files to Change

- `docs/agents/future/menu-configuration.md` — delete.
- `docs/agents/future/extension-architecture.md` — delete.
- `docs/agents/future/downstream-extension-workflow.md` — delete.
- `docs/agents/future/downstream-extension-tests.md` — delete.
- `docs/agents/frontend.md` — fold in any missing mechanics (Step 1/2), fix
  the dangling `future/extension-architecture.md` link (Step 3).
- `docs/agents/web-server.md` — fold in any missing mechanics (Step 1/2), fix
  the dangling `future/extension-architecture.md` link (Step 3).

## Notes

- After both `architect` and `docs` land their edits, run
  `grep -rn "docs/agents/future/\(menu-configuration\|extension-architecture\|downstream-extension-workflow\|downstream-extension-tests\)" .`
  across the repo to confirm no dangling reference remains anywhere (this is
  the issue's acceptance check, not scoped to one agent — whichever agent
  lands last should run it).
- `AGENTS.md`'s documentation table already lists `docs/agents/future/`
  generically and needs no change, since `crawler.md` keeps that row valid.
