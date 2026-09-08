# Issue: Refactor Logs/Memory menu entries to be config-file driven

## Description

Part of #794 (**menu track**). Implementation issue for **SPEC-1 (#795)**, whose
settled contract lives in `docs/agents/future/menu-configuration.md` → the
"Menu configuration file" section.

Navi's internal navigation is hard-coded:
`frontend/src/components/elements/StatsDisplay.jsx` renders
`<StatItem label="Logs" to="/logs" />` and
`<StatItem label="Memory" to="/memory/status" />` as inline cards in the stats
row, and the routes themselves are literal `<Route>` elements in
`frontend/src/main.jsx`. External links are already config-driven
(`web.links` → `source/lib/models/configs/Link.js` →
`source/lib/server/handlers/LinksHandler.js` → `GET /links.json` →
`frontend/src/clients/LinksClient.js` → `LinksMenu`); this feature mirrors that
precedent for the internal menu.

IMPL-1 introduces the dedicated menu configuration file and its full
serve/render pipeline (including per-entry validation), and moves Logs + Memory
out of the hard-coded `StatsDisplay` cards into a **new dedicated Bootstrap
dropdown in the header**, next to the existing external-links dropdown. This is a
deliberate, accepted visible change: Logs and Memory stop being inline buttons in
the stats row.

**Depends on:** SPEC-1 (#794 / #795). Independent of the extension track.

**Out of scope — deferred to IMPL-2 (#802) / SPEC-2 (#796):** operator-supplied
entries, merge-with-defaults append semantics, top-level `defaults: false`, the
effect of per-entry `hidden`, duplicate/collision handling, ordering/repositioning
rules, and the scrolling (`max-height` + `overflow-y: auto`) dropdown panel.
IMPL-1 **does** do per-entry validation (skip-and-warn on malformed entries).

## Problem

Adding, removing, or relabelling an internal menu entry currently means editing
React components and rebuilding the SPA. There is no configuration surface for
the internal menu and no Docker-volume-mountable file an operator can adjust,
unlike every other Navi configuration.

## Expected Behavior

- A stock `config/menu.yml` ships in the package with exactly two entries
  reproducing today's menu:

  ```yaml
  entries:
    - route: /logs
      text: Logs
    - route: /memory/status
      text: Memory
  ```

- With the stock file — or with the file absent/empty (loader owns the fallback
  constant) — the header shows a menu dropdown containing a **Logs** and a
  **Memory** entry that navigate to `/logs` and `/memory/status`.
- `GET /menu.json` responds with
  `{ "entries": [ { "route": "/logs", "text": "Logs" }, { "route": "/memory/status", "text": "Memory" } ] }`.
- `frontend/src/components/elements/StatsDisplay.jsx` no longer contains the
  Logs/Memory `<StatItem>` cards; the `<Route>` elements in
  `frontend/src/main.jsx` are unchanged (the pages still exist).
- A present-but-unparseable menu file (invalid YAML, or `entries` present but not
  a list) aborts startup with a typed error, matching the `ConfigIncluder` /
  `ConfigLoader` fail-fast posture on a broken main config.
- A single malformed entry (missing/non-string/whitespace `route`, non-string
  `text`, `hidden` not a boolean, unknown keys) is dropped with a `Logger.warn`
  and the rest of the menu renders normally — the menu never takes the server
  down.
- `yarn lint` and `yarn test` pass in both `source/` and `frontend/`.

## Solution

### Backend (`engine`)

- **CLI option:** add `-m` / `--menu` (string, `DEFAULT_MENU_FILE =
  'config/menu.yml'`) to `source/lib/services/application/ArgumentsParser.js`,
  mirroring `-c` / `--config` exactly; export `DEFAULT_MENU_FILE`.
- **Wiring:** `source/bin/navi.js` reads the parsed `menu` value and threads it
  through `Application.loadConfig` → `ApplicationInstance.loadConfig` →
  `ApplicationConfigurator.load`, alongside the main config path; the menu file
  is loaded once at startup. From there it must reach `WebServer` → `Router`
  (today: `run()` → `ServerController.build({ webConfig })` → `WebServer.build`
  → `new Router({ webConfig })`).
- **Parsing:** reuse the existing `ConfigIncluder` / `EnvStringResolver`
  machinery so `${VAR}` interpolation works inside `menu.yml`. No `include:`
  chain — the menu file is a single self-contained document.
- **Model / loader:** a dedicated `MenuEntry` model under
  `source/lib/models/configs/`, mirroring `Link.js` (`fromObject`, `toJSON` →
  `{ route, text }`, `text` defaults to `route`). A menu loader/config class
  parses the file, applies per-entry validation, owns the absent/empty fallback
  constant
  (`[{ route: '/logs', text: 'Logs' }, { route: '/memory/status', text: 'Memory' }]`),
  and exposes the render list. **Per-entry validation (in scope):** `route`
  required non-empty string, no whitespace, starts with `/` or is an absolute
  `http(s)://` URL; `text` optional non-empty string (defaults to `route`);
  `hidden` optional boolean — accepted and type-checked but **inert in IMPL-1**
  (its removal effect is IMPL-2). Malformed entries are skipped with a
  `Logger.warn` (`source/lib/common/utils/logging/Logger.js`); a file-level parse
  failure still throws (fail-fast).
- **Endpoint:** add
  `'/menu.json': new HandlerConfig(MenuHandler, [menuConfig])` to
  `source/lib/server/Router.js` `build()`, next to the `/links.json` line;
  `Router` takes the parsed menu config as a constructor parameter alongside
  `webConfig`. `/links.json` is untouched.
- **Handler:** `source/lib/server/handlers/MenuHandler.js`, modeled on
  `LinksHandler` — takes the menu config, responds
  `{ entries: MenuSerializer.serialize(...) }`.
- **Serializer:** `source/lib/serializers/MenuSerializer.js` (`extends
  Serializer`), modeled on `LinksSerializer`, emits `{ route, text }` per entry.
- **Stock file:** add `config/menu.yml` with the two default entries; ensure it
  is included in the published package.

### Frontend (`frontend`)

- **Client:** `frontend/src/clients/MenuClient.js` — `fetch('/menu.json')` →
  `data.entries ?? []`, mirroring `LinksClient.js`.
- **Components:** a parallel `MenuMenu*` family cloned from the `LinksMenu*`
  family — `MenuMenu.jsx` plus `controllers/MenuMenuController.jsx`,
  `helpers/MenuMenuHelper.jsx`, `MenuDropdown.jsx`, `MenuDropdownItem.jsx` under
  `frontend/src/components/elements/` — fully isolated from the links family
  (which stays untouched). Render `<MenuMenu />` in
  `frontend/src/components/pages/Layout.jsx` beside `<LinksMenu />` in the header.
  (Naming to be finalised during planning — e.g. `NavMenu*` if `MenuMenu` reads
  awkwardly.)
- **Remove:** the two `<StatItem label="Logs" .../>` / `Memory` lines (and the
  preceding `<div className="vr mx-1" />`) from `StatsDisplay.jsx`.
- **Rebuild:** rebuild the SPA into `source/static/` and commit the build output.

### Container (`docker`)

- `dockerfiles/production_navi_hey/Dockerfile`: add
  `ENV NAVI_MENU=/navi/menu.yml` and pass `-m $NAVI_MENU` in `CMD`, parallel to
  `NAVI_CONFIG` / `-c $NAVI_CONFIG`; ship the stock `menu.yml` at that path.

### Tests

- Backend (`source/spec/`): `-m` / `--menu` argument parsing; loader (stock file,
  absent, empty, unparseable → throws, malformed entry → skipped + warned,
  `text` defaulting); `MenuEntry` model; `MenuHandler` + `MenuSerializer`;
  `Router` registers `/menu.json`.
- Frontend (`frontend/spec/`): `MenuClient` fetch/parse; `MenuMenu*` render from
  `/menu.json` data; empty-response case (dropdown hidden/empty);
  `StatsDisplay` no longer renders Logs/Memory.

### Docs

- `docs/agents/web-server.md`: add `/menu.json` to the routes table; note the
  `-m` / `--menu` option and `NAVI_MENU`.
- `docs/agents/frontend.md`: update routing / component hierarchy for
  `MenuClient` and the menu dropdown.

## Benefits

- The internal menu becomes a first-class, Docker-volume-mountable configuration
  surface, consistent with the rest of Navi's config.
- Establishes the `menu.yml` → `/menu.json` → `MenuClient` pipeline that IMPL-2
  extends for operator-supplied entries.
- Removes hard-coded navigation from `StatsDisplay.jsx`.

## Agents

engine, frontend, docker.
