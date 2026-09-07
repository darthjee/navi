Parent: #783 — Docs: how_to_use_navi.md crawling guide omits the required `parser:` block and misdescribes extraction

## Description

Documentation-only. No source changes. First of two sub-issues of #783.

`docs/guides/how_to_use_navi.md` and its `docs/guides/navi/` sub-tree present crawling as a
first-class use case but never documented the `parser:` config block that drives extraction.
`README.md` already documents it correctly — Fields-table rows for `parser.*` / `emit.*` /
`emit.size` / `extraction.size` (`README.md:215-232`) and the "Data Extraction and Emission"
narrative section with worked YAML (`README.md:475-586`), added via #706 and #778. This
sub-issue ports that reference material into the guide tree. `README.md` is the source of
truth to port from.

Owner: `docs` agent (its scope covers `docs/guides/how_to_use_navi.md` and
`docs/guides/navi/*.md`).

Sub-issue 2 of #783 (fixing the crawl samples) depends on this one: the samples must link to
the new `extraction-configuration.md` and mirror its field names.

## Problem

A resource's `parser:` block is **required** for any extraction or emission to happen:

- `source/lib/jobs/ResourceRequestJob.js:94` — the extraction/emit path only runs
  `if (this.#resourceRequest.hasParser())`.
- `source/lib/models/request/ResourceRequest.js:196` — `hasParser()` is `!!this.parser`;
  there is no implicit or default parser.
- `source/lib/models/request/ResourceRequestParser.js:7` — the parser types are
  `regex`, `json_path`, `css`.
- `source/lib/services/builders/RegistriesBuilder.js:36-40` — all three are wired into the
  real app.

None of this is documented anywhere in `docs/guides/`. The guide's Table of Contents has an
"Emit Configuration" entry but nothing for the extraction/parser half, and
`docs/guides/navi/prerequisites.md`'s Fields table has no `parser.*` rows and no
`extraction.size` / `emit.size` rows. `docs/guides/navi/emit-configuration.md` opens by
claiming `emit` runs automatically per extracted item, which is false without a `parser:`
block.

## Solution

Port the already-correct content from `README.md:215-232` and `README.md:475-586`.

### `docs/guides/navi/extraction-configuration.md` (new)

Sibling of `emit-configuration.md`. Document `parser.type` and, per type, `match`, `filter`,
`fields`, `field`, `attribute`, `trim` — ported from `README.md:215-222` and
`README.md:479-485`. Include the `json_path` form where `match` is omitted / `''` / `'.'` and
the whole response body is treated as the array (#778). Add at least one worked `parser:` +
`emit:` YAML block; use `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` as the reference
shape. Link back to `how_to_use_navi.md` and across to `emit-configuration.md`.

### `docs/guides/navi/prerequisites.md`

Add `parser`, `parser.type`, `parser.match`, `parser.filter`, `parser.fields`, `parser.field`,
`parser.attribute`, `parser.trim` rows to the Fields table, plus `extraction.size` and
`emit.size` top-level rows — ported from `README.md:215-232`.

### `docs/guides/how_to_use_navi.md`

Add a Table-of-Contents entry for `navi/extraction-configuration.md`, placed **immediately
before** the "Emit Configuration" entry (extraction precedes emission: items are parsed, then
emitted).

Also add a short sentence in the guide body stating that a resource's `parser:` block is
**required** for any extraction or emission to happen, linking to the new
`navi/extraction-configuration.md`.

### `docs/guides/navi/emit-configuration.md`

Fix the opening sentence: `emit` sends onward the items produced by the resource's `parser`;
it is not automatic and does nothing without a `parser:` block. Add a cross-link to the new
extraction-configuration guide.

Make the worked Example runnable: prefix the existing `emit:` block with a minimal `parser:`
block (so the config is no longer invalid). Keep the `body_template` narrative and its
input/output JSON otherwise unchanged.

## Out of scope

- The crawl samples (`docs/guides/navi/samples/*` and `samples.md`) — sub-issue 2 of #783.
- `README.md` and `DOCKERHUB_DESCRIPTION.md` — already correct.
- Any change under `source/` or `frontend/`; frontend dashboard docs.

## Benefits

- One discoverable place in the guide for the `parser:` surface, parallel to
  `emit-configuration.md`.
- `emit-configuration.md` stops contradicting the engine and the README.
- Unblocks sub-issue 2.

## Acceptance criteria

- [ ] `docs/guides/navi/extraction-configuration.md` exists and documents all three parser
      types and every `parser.*` key, including the `json_path` root-array form.
- [ ] `docs/guides/navi/prerequisites.md` Fields table has the `parser.*`, `extraction.size`,
      and `emit.size` rows.
- [ ] `docs/guides/how_to_use_navi.md` Table of Contents links the new extraction guide,
      immediately before the "Emit Configuration" entry, and the guide body notes that a
      `parser:` block is required for any extraction/emission.
- [ ] `docs/guides/navi/emit-configuration.md` no longer states extraction is automatic,
      links to the extraction guide, and its worked Example includes a `parser:` block so the
      config is valid.
- [ ] No files under `source/` or `frontend/` are touched.
