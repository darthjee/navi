# Add the Data Extraction and Emission section

Add a new top-level `## Data Extraction and Emission` section to `README.md`, placed after `## Paginated Actions` (`README.md:384-456`) and before `## Roadmap` (`README.md:457`), since it documents another response-driven, config-only feature at the same level as those two.

Cover, in prose plus one or two worked YAML examples:

- What the feature does: after a successful response, an optional `parser` extracts structured items from the raw body, and an optional `emit` sends each extracted item to an external endpoint — running independently of (in parallel with) `actions`/`paginated_actions` chaining.
- The three parser types at a high level (`regex`, `json_path`, `css`), each producing the same shape of extracted item(s), deferring the full field-by-field breakdown to the Fields table (Step 2).
- A worked example adapted from `docs/agents/future/crawler/flows.md`'s "Loot Studios — Miniature Catalog → Majora" (the `json_path` + `emit` example), trimmed to fit README's style — reuse the YAML as-is where possible, adding a one-line client/resource explanation before it, matching how `README.md:406-427`'s Paginated Actions `### Example` introduces its own YAML block.
- A short second example for the `regex` standalone case (also from `flows.md`, the "Regex standalone" example), to show a parser used without `json_path`'s nested `fields`/`filter`.
- A closing line cross-referencing `docs/agents/future/crawler/flows.md` for further worked examples (mirroring the existing cross-reference style used for `docs/guides/navi/splitting-configuration.md` in `README.md:53`).

Do not include `css` example YAML here — the `css` parser type is covered by the Fields table (Step 2) and doesn't need its own worked example in this prose section.

## Files to Change

- `README.md` — insert the new `## Data Extraction and Emission` section between `## Paginated Actions` and `## Roadmap`.
