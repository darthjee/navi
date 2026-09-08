# Update `docs/agents/web-server.md`

Document the new endpoint, CLI option, and serializer.

## Changes

- **Routes table (`## Routes`, near the `/links.json` row ~line 63):** add a row
  `| \`GET\` | \`/menu.json\` | Internal navigation menu entries from the menu
  config file (\`{ route, text }\` list); defaults to Logs + Memory. |`
- **New subsection** under `## Routes` (or in the response-shape area alongside
  `GET /memory/status.json` etc.) describing the `GET /menu.json` response shape:
  `{ "entries": [ { "route": "/logs", "text": "Logs" }, ... ] }`, render order,
  `text` defaulting to `route`, `hidden` not serialized, malformed entries
  dropped + warned, file-level parse error is fail-fast.
- **`## Serialization` (~line 276):** add a sentence for `MenuSerializer`
  (flattens `MenuEntry` for `GET /menu.json`), matching the existing
  `LogSerializer` / `EmissionSerializer` phrasing.
- **`## Configuration` (~line 311):** document the `-m` / `--menu` CLI option
  (default `config/menu.yml`), the `NAVI_MENU` env var used by the production
  image, `${VAR}` interpolation support, and the absent/empty ⇒ Logs+Memory
  fallback.

## Files to Change

- `docs/agents/web-server.md` — routes table row, `/menu.json` response-shape
  subsection, `MenuSerializer` serialization note, `-m` / `--menu` +
  `NAVI_MENU` configuration note.
