# Plan: SPEC: config-driven internal menu configuration file

Issue: [795-spec-config-driven-internal-menu-configuration-file.md](../issues/795-spec-config-driven-internal-menu-configuration-file.md)

## Overview

Specification/documentation issue in the **menu track** of #794. Prose only, no
production code, no tests. `docs/agents/future/menu-configuration.md` already
exists (SPEC-2 / #796, merged) with a placeholder *"SPEC-1 skeleton (placeholder —
reconcile with #795)"* section and a `> Depends on #795` blockquote. This issue
**replaces that placeholder** with the finalized menu-file spec and removes the
caveat, so #796's "Operator-supplied entries" section rests on ratified names.
CLEAN-1 (#807) deletes the whole doc once the feature ships.

All decisions are settled on the issue (see its `## Solution`); this plan records
them precisely against the current code so IMPL-1 (#801) has a complete contract.

## Context

### Settled decisions (from the issue)

- **File**: `config/menu.yml` (YAML), beside the main `config/navi_config.yml`.
  Parsed with `ConfigIncluder` / `EnvStringResolver` so `${VAR}` interpolation
  works; **no `include:` chain** (flat single document).
- **Path configuration**: a new CLI option `-m` / `--menu`, default
  `config/menu.yml`, mirroring `-c` / `--config` in
  `source/lib/services/application/ArgumentsParser.js`. The prod image
  (`dockerfiles/production_navi_hey/Dockerfile`) sets `ENV NAVI_MENU=/navi/menu.yml`
  and its `CMD` passes `-m $NAVI_MENU`; operator overrides by mounting a file
  and/or setting the env var.
- **Entry shape**: ratified from #796 — top-level `entries:` list of
  `{ route, text[, hidden] }`; `route` is an internal path (leading `/`) or an
  absolute `http(s)://` URL; `text` defaults to `route`. `icon` / `group` /
  `order` stay out of scope.
- **Defaults**: a stock `config/menu.yml` shipped in the package with exactly
  `{ /logs, Logs }` and `{ /memory/status, Memory }`. Absent or empty file ⇒ those
  two defaults, resolved in code.
- **Serving path**: a new `GET /menu.json` — `HandlerConfig(MenuHandler,
  [menuConfig])` in `Router.build()` next to the `/links.json` line, plus a
  `MenuSerializer extends Serializer` emitting `{ entries: [{ route, text }] }`.
  `/links.json` is untouched.
- **Frontend consumption**: a new `frontend/src/clients/MenuClient.js`
  (`GET /menu.json`); the internal menu renders as **its own Bootstrap dropdown**
  built from the existing `LinksDropdown` / `LinksDropdownItem` primitives, placed
  next to the existing `Links` dropdown in
  `frontend/src/components/pages/Layout.jsx`. IMPL-1 removes the two `StatItem`
  cards from `frontend/src/components/elements/StatsDisplay.jsx`.
- **Relationship to `web.links`**: stay separate. `web.links` remains the external
  links dropdown; `/menu.json` is the internal-navigation menu (may still hold the
  odd external URL). No migration of `web.links`.
- **Error policy**: **fail-fast** for a present-but-unparseable menu file (bad
  YAML, or `entries` not a list) — same posture as `ConfigLoader`. Only individual
  entries get #796's skip-and-warn. Absent/empty is not an error.

### Current code the spec references (verified this session)

- `source/lib/services/application/ArgumentsParser.js` — `parseArgs` config;
  `-c/--config` option, `DEFAULT_CONFIG_FILE = 'config/navi_config.yml'`. The `-m`
  option is added the same way. `source/bin/navi.js` calls
  `ArgumentsParser.parse(process.argv.slice(2))` then `Application.loadConfig`.
- `source/lib/models/configs/Link.js` — `fromObject(entry)` accepts a string or
  `{ url, text }`, defaults `text` to `url`. The menu entry model mirrors this
  (`{ route, text }`, `text` defaults to `route`).
- `source/lib/server/Router.js` — `GET_ROUTES` map;
  `'/links.json': new HandlerConfig(LinksHandler, [this.#webConfig.links])`. The
  `/menu.json` entry goes in this map; `Router` gets the parsed menu config
  passed in alongside `webConfig`.
- `source/lib/server/handlers/LinksHandler.js` + `source/lib/serializers/`
  `LinksSerializer.js` (`extends Serializer`, `toJSON` → `{ url, text }`) — the
  exact template for `MenuHandler` + `MenuSerializer`.
- `frontend/src/clients/LinksClient.js` — `fetch('/links.json')` → `data.links`.
  `MenuClient` is the same against `/menu.json` → `data.entries`.
- `frontend/src/components/elements/LinksMenu.jsx` / `LinksMenuController.jsx` /
  `LinksMenuHelper.jsx` / `LinksDropdown.jsx` / `LinksDropdownItem.jsx` — the
  dropdown component family the internal menu reuses.
- `frontend/src/components/pages/Layout.jsx` — renders `<LinksMenu />` in the
  header; the internal-menu dropdown sits beside it.
- `frontend/src/components/elements/StatsDisplay.jsx` — the
  `<StatItem label="Logs" to="/logs" />` / `Memory` cards IMPL-1 deletes.
- `source/lib/services/config/ConfigIncluder.js` — YAML parse + `EnvStringResolver`
  `${VAR}` handling; `include:` chain is main-config-only.
- `dockerfiles/production_navi_hey/Dockerfile` — `ENV NAVI_CONFIG` + `CMD navi-hey
  -c $NAVI_CONFIG`; add `ENV NAVI_MENU` + `-m $NAVI_MENU` the same way.

### Coupling

- **#796** (merged) — its "Operator-supplied entries" section already uses
  `entries:`, `route`, `text`, `hidden`, `defaults: false`, the `menu.yml`
  placeholder name, and the `/menu.json` placeholder endpoint. This issue makes
  those real (note the filename becomes `config/menu.yml`) and removes the
  `> Depends on #795` blockquote.
- **IMPL-1 (#801)** implements the file loader, `/menu.json`, `MenuClient`, the
  dropdown, and the `StatsDisplay` removal.
- **IMPL-2 (#802)** implements #796's section on top of IMPL-1.

## Implementation Steps

### Step 1 — Replace the placeholder with the finalized spec

In `docs/agents/future/menu-configuration.md`:

- Delete the `> **Depends on #795 (SPEC-1).** …` blockquote.
- Replace the `## SPEC-1 skeleton (placeholder — reconcile with #795)` section
  (down to the `Everything from here down is **this issue's** contribution (#796)`
  line) with a finalized `## Menu configuration file` section covering, each with
  the settled recommendation:
  - **File & format** — `config/menu.yml`, YAML, `${VAR}` interpolation via
    `EnvStringResolver`, no `include:` chain; a full example file.
  - **Path configuration** — the new `-m` / `--menu` CLI option (default
    `config/menu.yml`), how `ArgumentsParser` gains it, how `source/bin/navi.js`
    and `Application.loadConfig` thread it, and the `ENV NAVI_MENU` + `CMD -m
    $NAVI_MENU` change in the prod Dockerfile. Show the operator's mount + env
    override.
  - **Entry shape** — the `entries:` list, `{ route, text, hidden }` table,
    `route` = path or absolute URL, `text` default, `Link`-model parallel. State
    `icon`/`group`/`order` out of scope (point at #796's "Rendering limits").
  - **Defaults** — the stock `config/menu.yml` contents; absent/empty ⇒ the two
    defaults in code; name where the in-code fallback lives (loader/model).
  - **Serving path** — `GET /menu.json`; `MenuHandler` (modeled on `LinksHandler`)
    + `MenuSerializer extends Serializer`; response `{ entries: [{ route, text }] }`;
    the `Router.build()` wiring next to `/links.json` and how the parsed menu
    config reaches `Router` (constructor param alongside `webConfig`).
  - **Frontend consumption** — `frontend/src/clients/MenuClient.js`; a menu
    dropdown component family cloned from `LinksMenu*` (or `LinksDropdown` reused
    directly) rendered in `Layout.jsx` next to `<LinksMenu />`; the `StatsDisplay`
    card removal. This is the IMPL-1 contract — be concrete about file names.
  - **Relationship to `web.links`** — separate surfaces; rationale (two
    single-purpose menus vs one overloaded file); no `web.links` migration.
  - **Backward compatibility & error policy** — absent/empty ⇒ defaults;
    present-but-unparseable ⇒ fail-fast (contrast with #796's per-entry
    skip-and-warn; align with `ConfigLoader`'s typed-error posture).

### Step 2 — Reconcile and finish

- Fix the hand-off sentence that followed the old skeleton
  ("Everything from here down is **this issue's** contribution (#796)…") so it
  still reads correctly after the new section.
- Sweep the "Operator-supplied entries" section (#796) for the placeholder
  filename `menu.yml` and update to `config/menu.yml`; confirm `entries:`,
  `route`, `text`, `hidden`, `defaults: false` all match the finalized shape
  (they should — this issue ratifies them).
- Update the doc's intro / `## Cross-references` so SPEC-1 (#795) reads as done,
  not pending.
- Verify acceptance criteria: doc covers filename, path mechanism, entry shape,
  defaults, serving path, frontend consumption, `web.links` relationship, and
  backward-compat/error policy, each with a concrete recommendation; IMPL-1 and
  the merged #796 section need no further decisions.

## Files to Change

- `docs/agents/future/menu-configuration.md` — replace the placeholder SPEC-1
  section with the finalized spec, drop the `Depends on #795` blockquote,
  reconcile the `menu.yml` → `config/menu.yml` naming and the intro/cross-refs.
  No other files.

## Notes

- Pure documentation under `docs/agents/future/`. No code, no specs, no build. No
  CI job covers `docs/**`, so there are no CI checks for this issue.
- No agent split: authoring a `docs/agents/future/` architecture doc is the
  architect's scope; no `.claude/agents` specialist owns that path. engine /
  frontend input is advisory and already captured in the settled decisions.
- IMPL-1 (#801), which this feeds, spans `source/` (CLI option, menu loader,
  `MenuHandler`, `MenuSerializer`, `Router` wiring), `frontend/` (`MenuClient`,
  dropdown, `StatsDisplay` edit) and `dockerfiles/` (`ENV NAVI_MENU` + `CMD`) —
  note that so its plan splits across engine / frontend / docker.
- Keep the new section self-contained for CLEAN-1 (#807) to move into
  `docs/agents/frontend.md` / `docs/agents/web-server.md` mechanically.
- Do not expand scope: no `icon`/`group`/`order`, no `web.links` migration, no
  `include:` support for the menu file. New concerns → comment on #794.
