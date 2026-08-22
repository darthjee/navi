# Close gap #6 in the crawler planning docs

`docs/agents/future/crawler/gaps.md` gap #6 ("Multi-condition filter syntax... to be defined") is what this issue resolves. Update the internal crawler design docs to reflect the settled syntax, so they stay a reliable reference for anyone reading them after this issue merges.

## Files to Change

- `docs/agents/future/crawler/gaps.md` — mark gap #6 resolved, briefly noting the chosen syntax (`equals` for field-vs-literal, `equals_field` for field-vs-field, conditions AND'ed) and pointing at issue #675.
- `docs/agents/future/crawler/decisions.md` — add a decision row documenting: `filter` conditions support field-to-field comparison via `equals_field` (in addition to the existing `equals` literal comparison), and `match` supports dot-notation nested paths.
