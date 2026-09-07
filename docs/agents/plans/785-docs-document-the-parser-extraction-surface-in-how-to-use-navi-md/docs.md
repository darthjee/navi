# docs Plan: docs: document the parser: / extraction surface in how_to_use_navi.md

Main plan: [plan.md](plan.md)

## Overview

The guide tree (`docs/guides/how_to_use_navi.md` + `docs/guides/navi/*.md`) presents crawling
as a first-class use case but never documents the `parser:` config block that drives
extraction. `README.md` already documents it correctly and is the source of truth to port
from:

- `README.md:215-232` — Fields-table rows for `parser.*`, `emit.*`, `emit.size`,
  `extraction.size`.
- `README.md:475-586` — the "Data Extraction and Emission" narrative with worked
  `json_path` (nested + root-array) and `regex` YAML examples.

This plan adds one new guide page and touches three existing ones. All content is ported /
adapted from the README — no new behaviour is being described, and nothing under `source/`
or `frontend/` is touched.

## Context

- A resource's `parser:` block is **required** for any extraction or emission to happen
  (`source/lib/jobs/ResourceRequestJob.js:94` runs the extraction/emit path only
  `if (this.#resourceRequest.hasParser())`; `ResourceRequest.hasParser()` is `!!this.parser`
  — no implicit/default parser).
- Parser types are `regex`, `json_path`, `css`
  (`source/lib/models/request/ResourceRequestParser.js:7`), all three wired into the real
  app (`source/lib/services/builders/RegistriesBuilder.js:36-40`).
- `json_path` accepts an omitted / `''` / `'.'` `match`, treating the whole response body as
  the array of items (added by #778; see `README.md:526`).
- Current gaps in the guide tree:
  - `how_to_use_navi.md` Table of Contents has an "Emit Configuration" entry but nothing for
    the extraction half.
  - `docs/guides/navi/prerequisites.md` Fields table has no `parser.*` rows and no
    `extraction.size` / `emit.size` rows.
  - `docs/guides/navi/emit-configuration.md` opens implying extraction happens on its own,
    has no link to an extraction page, and its worked Example (lines 31-44) declares `emit:`
    with no `parser:` — an invalid config.
- Reference shape for a full worked `parser:` + `emit:` flow:
  `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` (drives a real
  `ResourceRequestJob → ExtractionJob → EmitJob` chain; the `json_path` case uses
  `match: bundleObjs`, `filter`, `fields`).
- Sibling guide pages end with a `[← Back to How to Use Navi](../how_to_use_navi.md)` footer
  link and, where relevant, a `**Related sample:**` line — match that shape.

## Steps

- [01 — Create the extraction-configuration guide](docs/01-create-extraction-configuration-guide.md)
- [02 — Add parser.* / extraction.size / emit.size rows to prerequisites.md](docs/02-prerequisites-fields-table.md)
- [03 — Add the TOC entry and the "parser: is required" note to how_to_use_navi.md](docs/03-how-to-use-navi-toc-and-note.md)
- [04 — Fix emit-configuration.md](docs/04-fix-emit-configuration.md)

## Notes

- **CI:** `.circleci/config.yml` has no docs/markdown job — every job (`jasmine*`,
  `checks*`) is scoped to `source/`, `dev/`, `frontend/`, `clients/`, or `worker/`. A
  docs-only change runs no meaningful CI check; verification is by review only.
- Keep the new page's file name exactly `docs/guides/navi/extraction-configuration.md` —
  sub-issue 2 of #783 (fixing the crawl samples) depends on linking to it and mirroring its
  field names.
- Do not touch `docs/guides/navi/samples/*` or `samples.md` — that is sub-issue 2.
- `README.md` and `DOCKERHUB_DESCRIPTION.md` are already correct — do not change them; only
  port *from* the README.
- Distinguish `parser:` extraction from the pre-existing `actions[].parameters` path
  expressions (`parsedBody.*`) already documented in `prerequisites.md` — they are separate
  mechanisms that run in parallel; the new rows must not blur that.
