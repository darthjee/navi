# Engine samples index

Create `docs/guides/navi/samples.md` — the index page linked from
`how_to_use_navi.md`'s table of contents (wired in step 05).

Shape:

- `# Navi Samples` (H1).
- An intro paragraph: samples are end-to-end, copy-paste recipes that combine features to
  achieve a concrete goal; they complement — not replace — the per-feature reference pages
  (link `how_to_use_navi.md` / the feature guides); each recipe file is self-contained.
- `## Cache warm-up` — a bullet list, one row per file, matching the existing guide-TOC
  style `- [Title](samples/file.md) — one-line description.`:
  - `basic-warmup.md` — minimal headless config for a CI warm run.
  - `html-and-assets.md` — warm HTML pages plus the CSS/JS they reference.
  - `resource-chaining.md` — fan out from an index response into per-item detail requests.
  - `paginated-warmup.md` — one request per page, with a `max_page` cap.
  - `split-config.md` — organise a large config across files and namespaces.
  - `ci-failure-threshold.md` — fail the pipeline when too many jobs stay dead.
- `## Crawling` — same list style:
  - `emit-extracted-items.md` — send each extracted item to an external endpoint.
  - `emit-body-template.md` — reshape the emitted item with `body_template`.
  - `paginated-crawl-emit.md` — crawl every page and emit every item.
- Footer: `[← Back to How to Use Navi](../how_to_use_navi.md)` (matches sibling pages).

Use the exact recipe titles chosen in steps 01–02 as the link text. Links are within the
`navi/` subtree only.

## Files to Change

- `docs/guides/navi/samples.md` — new index page.
