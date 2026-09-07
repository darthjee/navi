# Add parser.* / extraction.size / emit.size rows to prerequisites.md

Extend the `docs/guides/navi/prerequisites.md` "Key points" Fields table (currently
`prerequisites.md:60-90`) with the extraction/emission keys, ported from
`README.md:215-232`.

Add rows for:

- `parser` — optional; extracts structured items from the raw response body after a
  successful response, independently of `actions` / `paginated_actions`. Required for any
  extraction/emission to happen.
- `parser.type` — one of `regex`, `json_path`, `css`.
- `parser.match` — per-`type` meaning (regex pattern / dot-path to the array / CSS
  selector); required for `regex` and `css`, optional for `json_path` (omitted =
  whole-body-as-array).
- `parser.filter` — `json_path` / `css` only; AND'ed include conditions.
- `parser.fields` — per-`type` field-mapping map.
- `parser.field` — single output key (`regex` required; `css` fallback single-field mode).
- `parser.attribute` — `css` fallback single-field mode; attribute to read (text content
  when absent).
- `parser.trim` — `css` fallback single-field mode; trim the resolved value (default
  `true`).

Also add two **top-level** rows (siblings of `resources` / `web` / `log`, not part of a
resource entry), consistent with how `README.md:231-232` frames them:

- `emit.size` — sizes the in-memory ring buffer behind `GET /emissions.json`; default
  `100`.
- `extraction.size` — sizes the in-memory ring buffer behind `GET /extractions.json`;
  default `100`.

Optionally add a one-line pointer from this table to the new
[Extraction Configuration](extraction-configuration.md) and existing
[Emit Configuration](emit-configuration.md) pages for the full breakdown. Do not restructure
the existing table or the `parsedBody` note below it; only append rows.

## Files to Change

- `docs/guides/navi/prerequisites.md` — add `parser.*`, `emit.size`, `extraction.size` rows
  to the Fields table.
