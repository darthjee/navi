Parent: #783 — Docs: how_to_use_navi.md crawling guide omits the required `parser:` block and misdescribes extraction

## Description

Documentation-only. No source changes. Second of two sub-issues of #783.

The three crawl recipes under `docs/guides/navi/samples/` and the **Crawling** section of
`docs/guides/navi/samples.md` show configs that have only an `emit:` block and describe
extraction as automatic. That is wrong — a `parser:` block is required or nothing is
extracted or emitted. This sub-issue fixes the samples so they are complete and runnable.

Owner: `docs` agent.

**Sub-issue 1 of #783 (#785) is merged** (commit `b7550a8`). Its output —
`docs/guides/navi/extraction-configuration.md`, the `parser.*` rows in
`docs/guides/navi/prerequisites.md`, the `how_to_use_navi.md` TOC entry, and the
`emit-configuration.md` opening fix — is already on `main`, so this sub-issue is
unblocked. The rewritten samples link to and mirror the field names in
`extraction-configuration.md`.

## Problem

Every crawl example in the guide omits the required `parser:` block and claims Navi
automatically *"parses the body as JSON and runs `emit` once per extracted item"*:

- `docs/guides/navi/samples/emit-extracted-items.md` — config + "What happens" walkthrough.
- `docs/guides/navi/samples/emit-body-template.md` — same.
- `docs/guides/navi/samples/paginated-crawl-emit.md` — same.
- `docs/guides/navi/samples.md` — the **Crawling** section blurbs.

Copy-pasted as written, these configs extract nothing and emit nothing:
`source/lib/jobs/ResourceRequestJob.js:94` gates the whole extraction/emit path on
`hasParser()`, and `docs/guides/navi/extraction-configuration.md` now states outright that
`emit:` alone does nothing.

## Expected Behavior

- Each of the three `docs/guides/navi/samples/*` crawl recipes carries a complete,
  runnable config: a `parser:` block plus the existing `emit:` block, with a "What happens"
  walkthrough that credits the parser for the extraction and `emit` only for forwarding.
- Each recipe links to `docs/guides/navi/extraction-configuration.md` for the full
  `parser.*` field reference (alongside the existing `emit-configuration.md` link).
- The example response bodies and walkthrough output in each recipe stay consistent with
  the `parser` config shown — in particular `emit-body-template.md`'s `body_template`
  tokens (`{:id}`, `{:address.city}`, `{:.}`) must resolve against the item shape the
  parser's `fields` map produces.
- `docs/guides/navi/samples.md`'s three **Crawling** blurbs mention that a parser is
  configured (e.g. "extract items with a `json_path` parser and emit each one").
- No files under `source/` or `frontend/` are touched.

## Solution

### `samples/emit-extracted-items.md`, `samples/emit-body-template.md`, `samples/paginated-crawl-emit.md`

Add the required `parser:` block to every config block. All three sample responses are
bare JSON arrays, so a `json_path` parser in its **root-array form** (`match` omitted) is
the natural fit — this also keeps every existing example response body valid as-is.
`fields` is still required, so each parser includes a **near-identity `fields:` map**
(e.g. `{ id: id, name: name, address: address }`) that preserves the current example
bodies and "What happens" output verbatim while making the config valid; for
`emit-body-template.md` the map must include whatever keys the `body_template` tokens
(`{:id}`, `{:address.city}`, `{:.}`) resolve against. No `filter:` — keep the samples
minimal; filtering is already shown in `extraction-configuration.md`'s worked example.

Rewrite the "parses the body as JSON and runs emit once per extracted item" lines in each
"What happens" section to describe the parser doing the extraction, then `emit` forwarding
each item. Keep the `paginated_actions` composition note in `paginated-crawl-emit.md`
(page fan-out first, then `parser` + `emit` per page). Add a link to
`docs/guides/navi/extraction-configuration.md` in each recipe's *Notes* section. Use
`source/spec/lib/jobs/ExtractionEmitFlow_spec.js` and the worked example in
`docs/guides/navi/extraction-configuration.md` as the reference config shape.

### `docs/guides/navi/samples.md`

Adjust each of the three **Crawling** recipe blurbs so it reflects that a parser is
configured (e.g. "extract items with a `json_path` parser and emit each one"). Leave the
"See it live" demo bullet as-is.

## Out of scope

- Net-new reference content: `extraction-configuration.md`, `prerequisites.md` Fields-table
  rows, `how_to_use_navi.md` TOC entry, `emit-configuration.md` opening fix — all delivered
  by sub-issue 1 of #783 (#785), already merged.
- `README.md` and `DOCKERHUB_DESCRIPTION.md` — already correct.
- Any change under `source/` or `frontend/`; frontend dashboard docs; the demo pointer (#781).

## Benefits

- Crawl configs in the guide become copy-pasteable and actually produce emissions.
- The samples stop contradicting the engine, `extraction-configuration.md`, and the README.

## Acceptance criteria

- [ ] All three `docs/guides/navi/samples/*` crawl recipes include a `parser:` block and a
      corrected "What happens" walkthrough.
- [ ] Each of those recipes links to `docs/guides/navi/extraction-configuration.md`.
- [ ] `emit-body-template.md`'s response body / `body_template` tokens stay consistent with
      the parser's `fields` output.
- [ ] `docs/guides/navi/samples.md` **Crawling** blurbs mention the parser.
- [ ] No files under `source/` or `frontend/` are touched.
