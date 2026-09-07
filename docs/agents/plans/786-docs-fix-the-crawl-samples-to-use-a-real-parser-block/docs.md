# docs Plan: docs: fix the crawl samples to use a real parser: block

Main plan: [plan.md](plan.md)

Issue: [786-docs-fix-the-crawl-samples-to-use-a-real-parser-block.md](../../issues/786-docs-fix-the-crawl-samples-to-use-a-real-parser-block.md)

## Overview

Bring the four Crawling docs artefacts back in sync with the engine and with
`docs/guides/navi/extraction-configuration.md` (delivered by #785, already on `main`). Each
of the three sample recipes gains a required `parser:` block and a corrected walkthrough;
`samples.md`'s Crawling blurbs are reworded to mention the parser.

## Context

- `source/lib/jobs/ResourceRequestJob.js:94` gates the whole extraction/emit path on
  `this.#resourceRequest.hasParser()`; `source/lib/models/request/ResourceRequest.js:196`
  defines `hasParser()` as `!!this.parser`. An `emit:` block with no `parser:` does nothing.
- `docs/guides/navi/extraction-configuration.md` (exists, from #785) is the field reference
  to link to. Its own worked examples and `docs/guides/navi/emit-configuration.md`'s
  "Body Template" example already show the exact target shape: a `json_path` parser with
  `match` omitted (root-array form) and a `fields:` map, e.g.

  ```yaml
  parser:
    type: json_path
    # match omitted — the whole response body is the array of items
    fields:
      id: id
  ```

- `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` is the end-to-end reference for the
  `parser` + `emit` config shape.
- All three sample responses are already bare JSON arrays, so the root-array form keeps
  every existing example response body and walkthrough output valid verbatim. `fields:` is
  required for `json_path`, so each parser carries a near-identity map whose output keys are
  exactly the keys the walkthrough (and, for `emit-body-template.md`, the `body_template`
  tokens) already reference. No `filter:` — keep the samples minimal; filtering is already
  demonstrated in `extraction-configuration.md`.
- Decisions locked during issue refinement: root-array form (omit `match`); near-identity
  `fields:` map preserving current bodies; no `filter:` in any sample.

## Steps

- [01 — emit-extracted-items.md: add parser block](docs/01-emit-extracted-items.md)
- [02 — emit-body-template.md: add parser block](docs/02-emit-body-template.md)
- [03 — paginated-crawl-emit.md: add parser block](docs/03-paginated-crawl-emit.md)
- [04 — samples.md: reword the Crawling blurbs](docs/04-samples-md-crawling-blurbs.md)

## CI Checks

None. CircleCI (`.circleci/config.yml`) only runs install/lint/test jobs scoped to
`source/`, `worker/`, `clients/node/`, and `frontend/`; there is no markdown lint or docs
job, and nothing under `docs/` triggers a pipeline job.

## Notes

- Pure docs change. Do not touch any file under `source/` or `frontend/` (acceptance
  criterion). The `source/` references above are read-only, for grounding the walkthrough
  wording.
- Out of scope (handled by #785, already merged): `extraction-configuration.md`,
  `prerequisites.md` Fields-table rows, the `how_to_use_navi.md` TOC entry, and the
  `emit-configuration.md` opening fix. `README.md` and `DOCKERHUB_DESCRIPTION.md` are
  already correct. The demo pointer is #781.
- Keep each recipe's existing example response bodies and walkthrough output values
  unchanged — the only substantive edits are: insert the `parser:` block, rewrite the
  sentence(s) that claim automatic JSON parsing, and add the
  `extraction-configuration.md` link in *Notes*.
- Consistency check after editing: every `{:token}` in `emit-body-template.md`'s
  `body_template` must correspond to a key produced by that recipe's `fields:` map
  (`id`, `name`, `address` → `address.city`), and `{:.}` (whole item) always resolves.
