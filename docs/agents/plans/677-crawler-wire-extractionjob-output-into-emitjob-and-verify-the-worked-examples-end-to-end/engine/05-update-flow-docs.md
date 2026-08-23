# Update the Runtime Flow docs

`docs/agents/flow/actions-and-assets.md` currently documents Actions, Paginated Actions, and Asset Processing (`HtmlParseJob`/`AssetDownloadJob`) but has zero mention of `ExtractionJob`/`EmitJob`. Add a new subsection alongside the existing ones, documenting the extraction→emit branch now that it's wired and verified: the `parser`+`emit` config shape, that `ExtractionJob` delegates to `EmitEnqueuer` to fan out one `EmitJob` per extracted item, and that this branch runs independently of (and without interference with) the `actions` branch — referencing the same three resource shapes (`actions`-only, `parser`+`emit`-only, both) that this issue's acceptance criteria cover.

Do this only once steps 1–4 are done and passing — the doc should describe confirmed behavior, not a plan.

## Files to Change

- `docs/agents/flow/actions-and-assets.md` — new subsection per above.
- `docs/agents/flow.md` — only if its index table lists each subsection by name (check current structure); add a row/entry if so, otherwise no change needed there.
