# engine Plan: Support arbitrary additional menu entries from the config file

Main plan: [plan.md](plan.md)

## Shared contracts

- **`GET /menu.json` response shape is frozen.** `entries` must be the final
  resolved render list in render order. `MenuHandler`, `MenuSerializer`, `Router`
  are untouched — all new behaviour is inside `MenuConfig` (and a small
  `MenuEntry` change). `hidden` / `defaults` are never serialized.
- **Menu configuration file schema** — implement exactly the table in
  [plan.md](plan.md) "Menu configuration file schema": merge-with-defaults,
  `defaults: false` (only way to empty; non-boolean → warn + treat `true`),
  `entries: []` → defaults remain (reverses IMPL-1), effective `hidden` (remove
  matching default / warn on non-default), reposition of a re-listed default
  (text override, bare re-list keeps default label), first-wins de-duplication by
  `route` with merged-list indices in the warning.
- Unchanged: absent/empty/no-`entries` → `DEFAULT_ENTRIES`; unparseable /
  non-list `entries` → `throw MenuConfigurationInvalid`; the malformed-entry
  `Logger.warn` keeps its current raw-index wording.
- **Stock template:** `source/config/menu.yml` becomes a commented example
  identical to the Docker copy the `docker` agent produces
  (`dockerfiles/production_navi_hey/config/menu.yml`).

## Steps

- [01 — MenuConfig: defaults switch + known-default identity](engine/01-menuconfig-defaults-switch.md)
- [02 — MenuConfig: hidden, reposition, first-wins de-dup](engine/02-menuconfig-merge-resolution.md)
- [03 — MenuEntry: carry hidden and preserve default labels](engine/03-menuentry-adjustments.md)
- [04 — Trim the packaged stock menu.yml](engine/04-trim-stock-menu-yml.md)
- [05 — Backend specs](engine/05-backend-specs.md)
- [06 — Update docs/agents/web-server.md](engine/06-update-web-server-doc.md)

## CI Checks

- `source`: `npm run lint && npm run report && npm run test` (CircleCI: `checks`,
  `jasmine`)

## Notes

- Do the merge/resolution on **validated raw entry objects** before constructing
  `MenuEntry` instances — the algorithm needs to see raw `hidden` and whether
  `text` was supplied, both of which `MenuEntry.fromObject` currently discards.
- Keep `MenuConfig.fromFile(path)` the public entry point and its return type
  (`MenuEntry[]`) unchanged — `ApplicationConfigurator` calls it as
  `menuPath ? MenuConfig.fromFile(menuPath) : []`.
- `Logger` is imported from `../../common/utils/logging/Logger.js` (not the path
  named in the older spec doc).
