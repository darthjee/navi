# Architect Plan: SPEC: downstream-developer extension workflow

Main plan: [plan.md](plan.md)

## Shared contracts

The architect's document is the source of truth for the "must settle" items in
[plan.md](plan.md)'s *Shared contracts* section:

- It **decides** the canonical backend handler base-class import specifier for the
  production image and uses it in every backend code sample. If the decision
  implies a package change (e.g. an `exports` subpath), it is recorded as a
  follow-up note for IMPL-5 (#805), not implemented here.
- It **authors** the one canonical worked example (route path, file names,
  component name, menu label, two test file names), mapped onto the
  `spec/fixtures/extensions/` tree IMPL-5 (#805) will build.
- It **references** (does not duplicate) the external-React Vite build snippet,
  whose permanent home is the docs guide (`docs.md`).
- It reuses the env/config names, mounted-folder layout, descriptor shapes,
  served route names, reload limitation, and security posture from
  `docs/agents/future/extension-architecture.md` and
  `docs/agents/future/menu-configuration.md` **verbatim**.

Everything the document states must be checkable against
`docs/agents/future/extension-architecture.md` with zero contradictions.

## Implementation Steps

### Step 1 — Author `docs/agents/future/downstream-extension-workflow.md`

Create the transient design document (flat file under `docs/agents/future/`, per
`AGENTS.md`'s "Future" convention). Open with a one-line "Part of #794
(**extension track**) — SPEC-5. Transient design material, removed by CLEAN-1
(#807)." banner mirroring the sibling docs. Structure:

1. **Scope & relationship to SPEC-3/SPEC-4** — this is the downstream developer's
   view; the container-side contract lives in `extension-architecture.md` and is
   referenced, not copied. Name the reused surface (env vars, `/navi/extensions`
   layout, descriptor shapes, `/extensions/frontend.json` + `/extensions/frontend/*`,
   "React as external").
2. **Extension project layout** — annotated tree of the *developer's own repo*:
   `backend/` source, `frontend/` source + components, the Vite lib build config,
   `config/menu.yml`, `tests/` (backend + frontend), a `package.json` with the
   build script, and a `Dockerfile` / `docker-compose.yml`. Show how each built
   artifact maps onto `/navi/extensions/{backend,frontend}`.
3. **Backend extension** — the `{ method, path, handler }` descriptor contract
   (quote SPEC-3), a handler example using the **canonical base-class import
   specifier** decided here, the response-error mapping the handler inherits, and
   "no build step — plain ESM".
4. **Frontend extension** — the `{ path, text, component }` descriptor contract
   (quote SPEC-4), a page/component example, the `vite build --lib` config with
   `react` / `react-dom` / `react-router-dom` as externals (reference the guide's
   snippet), the optional sibling `<name>.css`, and the single-React-instance
   requirement.
5. **Menu entry** — adding a `config/menu.yml` entry (`{ route, text }`, per
   SPEC-1 / #795) for the new route, and SPEC-4's auto-append behaviour (extension
   routes appear in the menu without editing the file; `hidden` / re-list levers).
6. **Image & compose** — `FROM darthjee/navi:<tag>` derived image vs. pure
   bind-mount; what to `COPY` vs. mount; **no frontend rebuild** (pre-built ESM
   bundles are mounted, the SPA is never rebuilt — SPEC-4); `docker_volumes/`
   convention and a `docker-compose.yml` snippet setting `NAVI_EXTENSIONS_ENABLED`
   and mounting the folder at `/navi/extensions`; the `NAVI_MENU` mount.
7. **Worked example** — the full, concrete one backend route + one frontend page
   + one menu entry + one backend test + one frontend test, with every file's
   contents, the resulting mounted-folder tree, and the `docker-compose.yml`. Call
   out that IMPL-5 (#805) lifts this into `spec/fixtures/extensions/` and name the
   expected fixture sub-paths.
8. **Upgrade checklist** — base-Navi-bump steps: re-check the import-map
   React/React-Router versions the extension builds against; confirm the backend
   handler base-class import specifier is unchanged; re-scan for stock-vs-extension
   route-name collisions (SPEC-3: stock always wins, extra is skipped with a warn);
   re-run the extension's own tests against the new image; remember extensions are
   fixed for the process lifetime (restart, not `PATCH /engine/reload`).
9. **Deferred / out of scope** — the full downstream Jasmine test *setup* and
   `spec/`-tree isolation is SPEC-6 (#800); this doc only shows the two example
   tests. Also defer anything already deferred by SPEC-3/SPEC-4 (recursive
   subfolders, extra HTTP verbs, sandboxing, hot-reload, npm deps for extension
   code).

Acceptance: covers every bullet of the issue's *Expected Behavior* for
deliverable 1; the worked example is concrete enough for IMPL-5 to implement
directly; no contradiction with `extension-architecture.md`; the canonical
handler import specifier is stated once and used consistently.

### Step 2 — Update sibling cross-references

Point the existing "SPEC-5 (#799)" mentions at the new file:

- `docs/agents/future/extension-architecture.md` — the *Cross-references* section
  and the inline "the SPEC-5 (#799) user guide" mentions: link
  `downstream-extension-workflow.md` and note the security warning / reload
  limitation / external-React snippet now live in the
  `docs/guides/navi/extending-navi.md` guide.
- `docs/agents/future/menu-configuration.md` — the "SPEC-5 (#799) and the how-to"
  cross-reference: same link update.

Keep the edits minimal — just the links and a phrase each; no restructuring of the
sibling docs.

## Files to Change

- `docs/agents/future/downstream-extension-workflow.md` — **new**; the SPEC-5
  design document (sections 1–9 above).
- `docs/agents/future/extension-architecture.md` — update SPEC-5 cross-references
  to link the new file and the new guide.
- `docs/agents/future/menu-configuration.md` — update the SPEC-5 cross-reference
  to link the new file.

## Notes

- Documentation-only; no CI job applies.
- Do not create `spec/fixtures/extensions/` here — that is IMPL-5 (#805). This
  document only specifies and names it.
- If settling the canonical import specifier turns out to need a package
  `exports` map or alias, record it as an explicit follow-up bullet for IMPL-5,
  do not implement it in this spec issue.
