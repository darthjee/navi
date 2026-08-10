# Docs Plan: Add max page

Main plan: [plan.md](plan.md)

## Shared contracts

Can rely on: `max_page` is a `ResourceRequest`-level YAML key (sibling of `url`/`status`/`disabled`), capping how many pages of that resource ever get enqueued regardless of caller, counting pages not page numbers, defaulting to unlimited on omitted/`null`/`0`/invalid values. See [plan.md](plan.md)'s "Shared contracts" for the full spec. This plan only adds prose/examples — no behavior to produce.

## Implementation Steps

### Step 1 — `docs/guides/navi/prerequisites.md`

Add a `max_page` row to the `ResourceRequest` fields table, right after the `disabled` row:

```markdown
| `max_page` | Optional. When this request is the target of another resource's `paginated_actions`, caps how many of its pages ever get enqueued — a ceiling owned by this resource, applying uniformly to every caller. Counts pages, not page numbers (the first `max_page` pages in iteration order, whether `zero_indexed` or not). Omitted, `null`, `0`, or any other non-positive-integer value means unlimited; a present-but-invalid value also logs a warning. Defaults to unlimited. |
```

### Step 2 — `docs/guides/navi/paginated-actions.md`

Add a new `### Capping pages with max_page` section right before the closing `[← Back to How to Use Navi]` link, extending the existing `categories`/`products_page` example with `max_page: 2` on `products_page`:

```markdown
### Capping pages with `max_page`

Sometimes you don't want to warm every page a `paginated_actions` caller reports — just the first few, most-likely-to-be-hit ones. `max_page` caps this from the **target** resource's side, independent of who calls it:

\`\`\`yaml
resources:
  categories:
    - url: /categories.json
      status: 200
      paginated_actions:
        - resource: products_page
          pagination:
            - pages: parsedBody.pagination.pages
            - page_key: page
            - zero_indexed: false
          parameters:
            per_page: headers['x-per-page']
  products_page:
    - url: /products/{:page}.json?per_page={:per_page}
      status: 200
      max_page: 2
\`\`\`

Even though `/categories.json` reports 3 pages, `products_page` caps itself at 2 — Navi enqueues only `/products/1.json?per_page=25` and `/products/2.json?per_page=25`. `max_page` is a property of `products_page` itself: **every** caller that fans out into it is capped the same way, not just this one. It counts pages, not page numbers, so it composes the same way regardless of `zero_indexed` (a `zero_indexed: true` caller capped at `max_page: 2` would enqueue pages `0` and `1`, not `1` and `2`).

Omitted, `null`, `0`, or any other non-positive-integer value means unlimited (all pages the caller resolves are enqueued) — the default. A present-but-invalid value (e.g. a negative number or a non-numeric string) also logs a warning.
```

(Escape the code fences as literal ` ``` ` when writing the file — shown here as `\`\`\`` only to nest inside this plan's own fenced block.)

### Step 3 — `README.md`

`README.md` carries its own near-duplicate copy of this same content, separate from `docs/guides/`, so mirror both additions there too:

- Same `max_page` row as Step 1, inserted into `README.md`'s `ResourceRequest` fields table right after its `disabled` / `enabled` row.
- Same "Capping pages with `max_page`" section as Step 2, inserted right after the existing "Paginated Actions" section's worked example (`If the /categories.json response contains ...` paragraph) and before the next `---` separator.

Leave the one-line "Paginated resource support" feature bullet near the top of `README.md` as-is — it's a generic summary, not a field spec, and doesn't need updating.

## Files to Change

- `docs/guides/navi/prerequisites.md` — new `max_page` table row.
- `docs/guides/navi/paginated-actions.md` — new "Capping pages with `max_page`" section.
- `README.md` — same two additions mirrored into its own duplicate table and "Paginated Actions" section.

## Notes

- No code changes in this plan — purely documentation, written to match whatever `engine` actually implements (see [engine.md](engine.md)). If engine's exact wording around validation/logging changes during implementation, update these three files to match rather than treating this plan's snippets as final copy.
