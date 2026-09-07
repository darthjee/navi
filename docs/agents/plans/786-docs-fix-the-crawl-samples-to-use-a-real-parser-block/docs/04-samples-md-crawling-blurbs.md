# samples.md: reword the Crawling blurbs

`docs/guides/navi/samples.md` has a **Crawling** section with three recipe bullets plus a
"See it live" demo bullet. The three recipe blurbs currently describe only the emit half
("send each extracted item to an external endpoint", "reshape the emitted item with
`body_template`", "crawl every page and emit every item") and imply extraction just
happens.

## What to do

Reword each of the three recipe blurbs so it reflects that a `json_path` parser is
configured to do the extraction. Keep them one line each, same link text and targets.
Suggested wording:

- `[Emit every extracted item to an external endpoint](samples/emit-extracted-items.md)` —
  "extract items from a JSON listing with a `json_path` parser and `POST` each one to an
  external endpoint."
- `[Reshape the emitted body with a template](samples/emit-body-template.md)` —
  "extract items with a `json_path` parser, then reshape each one with `emit.body_template`
  before sending."
- `[Crawl every page and emit every item](samples/paginated-crawl-emit.md)` —
  "fan out one request per page, extract each page's items with a `json_path` parser, and
  emit every one."

Leave the intro paragraph, the **Cache warm-up** section, and the "See it live: the
`navi-hey` demo" bullet unchanged (the demo bullet already mentions "four resources, one
per parser type").

## Files to Change

- `docs/guides/navi/samples.md` — reword the three **Crawling** recipe bullets to mention
  the `json_path` parser.
