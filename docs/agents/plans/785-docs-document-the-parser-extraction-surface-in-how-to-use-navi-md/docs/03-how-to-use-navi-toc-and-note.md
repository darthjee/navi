# Add the TOC entry and the "parser: is required" note to how_to_use_navi.md

Two small edits to `docs/guides/how_to_use_navi.md`.

1. **Table of Contents entry** — add a bullet linking `./navi/extraction-configuration.md`,
   placed **immediately before** the existing "Emit Configuration" entry
   (`how_to_use_navi.md:25`), since extraction precedes emission (items are parsed, then
   emitted). Match the one-line-description style of the surrounding TOC bullets, e.g.:

   > `- [Extraction Configuration](./navi/extraction-configuration.md) — Extracting structured items from a response with a required `parser:` block (`regex` / `json_path` / `css`), consumed by `emit`.`

2. **Body note** — add a short sentence in the guide body stating that a resource's
   `parser:` block is **required** for any extraction or emission to happen, linking to
   `./navi/extraction-configuration.md`. Place it wherever extraction/crawling is first
   introduced in the prose (near the existing mention of crawling as a use case); a single
   sentence is enough — the full detail lives on the new page.

Do not modify the crawl samples wording or `samples.md` — that is sub-issue 2 of #783.

## Files to Change

- `docs/guides/how_to_use_navi.md` — add the TOC bullet before "Emit Configuration" and one
  body sentence noting `parser:` is required, linking the new page.
