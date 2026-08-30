# Document the paginated_actions interaction in flows.md

Extend `docs/agents/future/crawler/flows.md` so the "Interaction with existing chaining"
section (currently only about `actions`) also covers `paginated_actions`.

Add, after the existing bullet list that ends with "Have both (crawling with extraction —
extracts data AND chains children)":

- A short subsection (e.g. `### Interaction with paginated_actions`) explaining:
  - `ExtractionJob` is enqueued per performed `ResourceRequestJob`, in parallel with
    `enqueueActions` and `enqueuePaginatedActions`, from
    `ResourceRequestJob.#handleResponse()`.
  - When the **origin** resource (whose response drives pagination) also has `parser` +
    `emit`, its extraction/emit fires exactly once for the origin response, independently of
    the pagination fan-out.
  - When the **paginated target** resource has `parser` + `emit`, each per-page
    `ResourceRequestJob` runs its own `ExtractionJob` → `EmitJob` chain independently — one
    extraction/emit per page, with that page's parameters applied to field mapping.
  - No duplication, no missing emits, no cross-talk between the pagination and extraction
    paths.
- A tiny worked example in the same style as the existing "Execution flow" numbered lists:
  a resource with `paginated_actions` over 3 pages where the target resource has
  `parser` + `emit`, resulting in 3 `ExtractionJob`s and N × 3 `EmitJob`s.

Keep the wording consistent with the rest of the doc (present tense, `ResourceRequestJob` /
`ExtractionJob` / `EmitJob` capitalised, YAML fenced blocks where a config snippet helps).
Do not restructure the file or touch the sibling crawler docs.

## Files to Change

- `docs/agents/future/crawler/flows.md` — add the `paginated_actions` interaction subsection
  and worked example under "Interaction with existing chaining".
