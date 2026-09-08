# Docs Plan: SPEC: downstream-developer extension workflow

Main plan: [plan.md](plan.md)

## Shared contracts

The guide is the **permanent home** for the three things SPEC-3/SPEC-4 deferred to
"the SPEC-5 user guide":

1. The security warning — arbitrary JavaScript, mounted into the container, runs
   in the same process as Navi with no isolation; only mount code you wrote or
   audited, from a volume you control.
2. The reload limitation — extensions are fixed for the process lifetime; changing
   them requires a container restart; `PATCH /engine/reload` does not affect them.
3. The copy-pasteable external-React build snippet — a `vite build --lib` (or
   Rollup) config with `react`, `react-dom`, `react-router-dom` as externals.

All identifiers (env var names, `NAVI_EXTENSIONS_DIR` default `/navi/extensions`,
`NAVI_MENU`, route names `/extensions/frontend.json` + `/extensions/frontend/*`,
the `{ method, path, handler }` and `{ path, text, component }` descriptor shapes,
and the worked-example route path / file names / component name / menu label) must
match `docs/agents/future/downstream-extension-workflow.md` **exactly**. The guide
is a condensed, operator-facing retelling of that document — it decides nothing
new. Use the canonical backend handler base-class import specifier chosen in
[architect.md](architect.md)'s Step 1.

## Implementation Steps

### Step 1 — Create `docs/guides/navi/extending-navi.md`

New guide page in the same house style as the existing `docs/guides/navi/*.md`
pages (short intro paragraph, then task-oriented sections with fenced code blocks;
relative links back to siblings). Cover:

- **What extensions are and when to use them** — add your own backend routes and
  frontend pages on top of the stock `darthjee/navi-hey` image without forking;
  fully opt-in and off by default.
- **Security warning** — call it out prominently near the top (blockquote), full
  wording per *Shared contracts* item 1.
- **Enabling** — set `NAVI_EXTENSIONS_ENABLED` truthy; mount your folder at
  `/navi/extensions` (or point `NAVI_EXTENSIONS_DIR` elsewhere); mount your
  `config/menu.yml` (or set `NAVI_MENU`). A `docker-compose.yml` snippet.
- **Folder layout** — the `backend/` and `frontend/` flat subtrees, lexicographic
  load order, either may be absent.
- **A backend route** — the `{ method, path, handler }` descriptor, a minimal
  handler using the canonical base-class import specifier, the error mapping it
  inherits, "no build step".
- **A frontend page** — the `{ path, text, component }` descriptor, the external-
  React `vite build --lib` snippet (*Shared contracts* item 3, copy-pasteable),
  the optional sibling `<name>.css`, and that the SPA is **not** rebuilt.
- **A menu entry** — a `config/menu.yml` `{ route, text }` line, and that
  extension routes are auto-appended to the menu anyway.
- **Condensed worked example** — the same one route + one page + one menu entry as
  the design doc, operator-facing (drop the test files here; point at the design
  doc / SPEC-6 for testing).
- **Reload limitation** — *Shared contracts* item 2, as its own short section.
- **Upgrading the base image** — the short checklist (React/Router version
  alignment, import specifier unchanged, route-name collisions, re-run your
  tests, restart-not-reload).

### Step 2 — Link the guide from the guides index

Add an entry to the Table of Contents in `docs/guides/how_to_use_navi.md`,
matching the existing `- [Title](./navi/<file>.md) — <one-line description>.`
format, placed after the configuration-oriented entries (e.g. after
`Splitting Configuration Across Files`). One line, terse description.

## Files to Change

- `docs/guides/navi/extending-navi.md` — **new**; the user-facing extension guide.
- `docs/guides/how_to_use_navi.md` — add the ToC entry linking the new guide.

## Notes

- Documentation-only; no applicable CI job.
- Do not restate the container-side loader mechanics in depth — link the design
  doc. The guide's job is "how a developer builds and ships an extension", not
  "how Navi loads one".
- The exact filename `extending-navi.md` is a suggestion; if a better fit exists
  in the `docs/guides/navi/` set, use it — but keep it a single new page, linked
  from the index.
