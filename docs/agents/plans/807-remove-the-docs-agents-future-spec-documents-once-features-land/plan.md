# Plan: Remove the docs/agents/future spec documents once features land

Issue: [807-remove-the-docs-agents-future-spec-documents-once-features-land.md](../issues/807-remove-the-docs-agents-future-spec-documents-once-features-land.md)

## Overview

Delete the four now-superseded `docs/agents/future/` spec files for #794
(`menu-configuration.md`, `extension-architecture.md`,
`downstream-extension-workflow.md`, `downstream-extension-tests.md`), folding in
only genuinely missing mechanics (no design rationale) into the permanent docs
first, and fix the resulting dangling links. The bulk of the touched files
(`docs/agents/future/*`, `docs/agents/frontend.md`, `docs/agents/web-server.md`)
fall under `architect`'s own documentation scope; the operator-facing guide
(`docs/guides/navi/extending-navi.md`) falls under `docs`.

## Agents involved

- [architect](architect.md)
- [docs](docs.md)

## Shared contracts

`docs.md`'s two link fixes must point at wherever `architect.md`'s edits leave
the relevant content — not at fixed line numbers, since those can shift:

- The intro-paragraph link (currently at
  `future/downstream-extension-workflow.md`) should point at the `## Extensions`
  section of `docs/agents/frontend.md` and/or the extra-routes section of
  `docs/agents/web-server.md` (whichever now carries the loader mechanics), or
  be dropped if the surrounding sentence is redundant once the guide's own
  content is self-contained.
- The "Testing your extension" section's link (currently at
  `future/downstream-extension-tests.md`) should point at whatever section of
  `docs/agents/frontend.md` documents the Jasmine test harness for downstream
  extension code (added by IMPL-6, #806), or be dropped for the same reason.

No new `docs/agents/` page is created for this issue, and `AGENTS.md`'s
documentation table does not need a new row (`docs/agents/future/crawler.md`,
an unrelated spec, keeps the `Future` row valid).
