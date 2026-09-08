# Engine Plan: Refactor Logs/Memory menu entries to be config-file driven

Main plan: [plan.md](plan.md)

## Shared contracts

Produces the `GET /menu.json` response (contract 1), the `-m` / `--menu` CLI
option (contract 2, engine side), and the packaged stock file
`source/config/menu.yml` (contract 3, package side). Full detail in
[plan.md](plan.md#shared-contracts).

Key points this agent owns:

- `-m` / `--menu`, default `config/menu.yml`, exported `DEFAULT_MENU_FILE`,
  mirroring `-c` / `--config`.
- `GET /menu.json` → `{ entries: [ { route, text }, ... ] }`, render order,
  `text` always populated (defaults to `route`), `hidden` never serialized.
- Absent/empty file ⇒ two defaults (`/logs` "Logs", `/memory/status` "Memory")
  via an in-code constant; explicit `entries: []` ⇒ empty list.
- File-level parse failure ⇒ fail-fast typed exception; per-entry failure ⇒
  drop + `Logger.warn`.
- Menu config is threaded to `Router` as a plain value alongside `webConfig` —
  not added to the `Config` model.

## Steps

- [01 — Add the `-m` / `--menu` CLI option](engine/01-add-menu-cli-option.md)
- [02 — `MenuEntry` model + menu loader with validation](engine/02-menu-entry-model-and-loader.md)
- [03 — `GET /menu.json`: serializer, handler, Router wiring](engine/03-menu-json-endpoint.md)
- [04 — Thread the menu config through startup](engine/04-wire-menu-config-through-startup.md)
- [05 — Stock `config/menu.yml` + packaging](engine/05-stock-menu-file-and-packaging.md)
- [06 — Update `docs/agents/web-server.md`](engine/06-update-web-server-doc.md)

## CI Checks

- `source`: `cd source && npm run lint` (CI job: `checks`)
- `source`: `cd source && npm test` (CI job: `jasmine`)

## Notes

- The existing `ArgumentsParser_spec.js` asserts `toEqual({ config: ... })` on
  every case — each expectation must gain `menu: DEFAULT_MENU_FILE` (or the
  passed value). Do not switch to `jasmine.objectContaining`; keep the exact
  match style the file uses.
- New typed exception for the file-level failure belongs under
  `source/lib/exceptions/config/` next to `MissingTopLevelConfigKey` /
  `ConfigurationFileNotFound`, and should follow the same class shape.
- Warnings use `Logger` from `source/lib/common/utils/logging/Logger.js`
  (`Logger.warn`), matching the skip-and-continue precedent in
  `source/lib/parsers/css_selector_parser/FilterMatcher.js`.
- Keep `/links.json` and `LinksHandler` / `LinksSerializer` completely
  untouched — the menu is a separate surface.
