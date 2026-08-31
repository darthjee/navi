# Feature-guide "Related sample" back-links

In each engine feature guide that has a matching recipe, add a single line directly
**above** the existing `[← Back to How to Use Navi](../how_to_use_navi.md)` footer, with one
blank line separating it from the preceding content:

`**Related sample:** [<recipe title>](samples/<file>.md)`

When a guide has two matching recipes, list both on the one line, comma-separated.

Mapping:

- `docs/guides/navi/paginated-actions.md` → `samples/paginated-warmup.md`,
  `samples/paginated-crawl-emit.md`
- `docs/guides/navi/emit-configuration.md` → `samples/emit-extracted-items.md`,
  `samples/emit-body-template.md`
- `docs/guides/navi/warming-html-assets.md` → `samples/html-and-assets.md`
- `docs/guides/navi/splitting-configuration.md` → `samples/split-config.md`

Leave `prerequisites.md`, `reference.md`, and the four `option-*.md` pages untouched — they
are cross-cutting reference/integration pages, not single-feature guides. No back-link is
added for `resource-chaining.md` because its feature (`actions`) has no dedicated feature
guide.

Link text is the recipe's H1 title chosen in steps 01–02. Links stay within the `navi/`
subtree.

## Files to Change

- `docs/guides/navi/paginated-actions.md` — add `Related sample:` line.
- `docs/guides/navi/emit-configuration.md` — add `Related sample:` line.
- `docs/guides/navi/warming-html-assets.md` — add `Related sample:` line.
- `docs/guides/navi/splitting-configuration.md` — add `Related sample:` line.
