# Plan: Refactor Logs/Memory menu entries to be config-file driven

Issue: [801-refactor-logs-memory-menu-entries-to-be-config-file-driven.md](../../issues/801-refactor-logs-memory-menu-entries-to-be-config-file-driven.md)

## Overview

Implement SPEC-1 (#795): make Navi's internal navigation driven by a dedicated
`config/menu.yml` file instead of hard-coded React components. The backend adds a
`-m` / `--menu` CLI option, loads and validates the file into a `MenuEntry`
model, and serves it at a new `GET /menu.json` via a `MenuHandler` +
`MenuSerializer` modeled on the `Links*` pair. The frontend adds a `MenuClient`
and a `MenuMenu*` component family (cloned from `LinksMenu*`) that renders a
dedicated header dropdown next to the existing links dropdown, and drops the
hard-coded Logs/Memory `<StatItem>` cards from `StatsDisplay.jsx`. The production
Docker image is wired to ship and point at the stock menu file. Operator
merge/hide/dedup/ordering semantics and the scrolling panel are deferred to
IMPL-2 (#802).

## Agents involved

- [engine](engine.md) — CLI option, `MenuEntry` model + menu loader/validation, `GET /menu.json` (handler + serializer + `Router` wiring), startup threading, stock file + packaging, `docs/agents/web-server.md`.
- [frontend](frontend.md) — `MenuClient`, `MenuMenu*` component family, `Layout.jsx` wiring, `StatsDisplay.jsx` removal, `docs/agents/frontend.md`.
- [docker](docker.md) — production image: ship the stock `menu.yml` and pass `-m $NAVI_MENU`.

## Shared contracts

### 1. `GET /menu.json` response (engine → frontend)

```json
{
  "entries": [
    { "route": "/logs", "text": "Logs" },
    { "route": "/memory/status", "text": "Memory" }
  ]
}
```

- `entries`: JSON array, in render order. Always present.
  - Absent / empty / whitespace-only menu file ⇒ the two defaults above
    (the loader owns this fallback constant).
  - A file with an explicit empty `entries: []` list ⇒ `{ "entries": [] }`
    (valid; the frontend then renders no dropdown, exactly like `LinksMenu`
    with zero links).
- Each entry object has exactly:
  - `route` — non-empty string, no whitespace, either starts with `/` (internal
    SPA route) or matches `^https?://` (external URL).
  - `text` — non-empty string; the server always populates it, defaulting to
    `route` when the file omitted it (mirrors `Link` defaulting `text` to `url`).
- `hidden` is **not** serialized. In IMPL-1 it is accepted and type-checked
  (boolean) but has no effect; its removal semantics are IMPL-2.
- Malformed entries are dropped server-side with a `Logger.warn` and never reach
  the response. A file-level parse failure (invalid YAML, or `entries` present
  but not a list) is fail-fast — startup aborts with a typed exception, matching
  `ConfigLoader` / `ConfigIncluder` posture on a broken main config.

### 2. Menu-file path: CLI option ↔ env var (engine ↔ docker)

- **engine**: new CLI option `-m` / `--menu`, string, default
  `config/menu.yml`, exported as `DEFAULT_MENU_FILE` from
  `source/lib/services/application/ArgumentsParser.js`. Mirrors `-c` / `--config`
  exactly (same `parseArgs` options block, same "flag without value throws"
  behaviour). `${VAR}` interpolation inside the file works (reuses
  `EnvStringResolver`).
- **docker**: production image (`dockerfiles/production_navi_hey/Dockerfile`)
  sets `ENV NAVI_MENU=./config/menu.yml` and changes `CMD` to
  `navi-hey -c $NAVI_CONFIG -m $NAVI_MENU`, exactly parallel to the existing
  `NAVI_CONFIG` / `-c $NAVI_CONFIG` pair, and `COPY`s a stock menu file into the
  image (see contract 3).

### 3. Stock menu file format & locations

```yaml
entries:
  - route: /logs
    text: Logs
  - route: /memory/status
    text: Memory
```

Top-level `entries:` mapping list; every entry is a mapping (no bare-string
shorthand). Shipped in two places, mirroring how the main `web.yml` is handled
today:

- `source/config/menu.yml` — added to `source/package.json` `"files"` so
  `npm install -g navi-hey` provides a default on disk.
- `dockerfiles/production_navi_hey/config/menu.yml` — `COPY`d to
  `/home/node/app/config/menu.yml` in the production image (same mechanism as
  `dockerfiles/production_navi_hey/config/web.yml`).

Because the loader also has an in-code fallback constant, a deployment that
deletes or blanks the file still gets the Logs + Memory menu.

### 4. SPA build output (informational)

`source/static/` is **git-ignored** and rebuilt by CI (`scripts/ci.sh
build-frontend`) at publish time — `frontend/dist/` → `source/static/`. IMPL-1
does **not** commit built assets (the SPEC's "committed into `source/static/`"
line predates the current ignore rule). The frontend agent only builds locally to
confirm the SPA compiles.

## CI Checks

- `source`: `cd source && npm run lint` (CI job: `checks`) and
  `cd source && npm test` (CI job: `jasmine`).
- `frontend`: `cd frontend && npm run lint` (CI job: `checks-frontend`) and
  `cd frontend && npm test` (CI job: `jasmine-frontend`).
- No CI job exercises the production Dockerfile on a PR (image build runs only on
  version tags), so the docker change has no PR-blocking check — verify by
  inspection.

## Notes

- **Menu loader scope of "reuse `ConfigIncluder`":** reuse the *core* of
  `ConfigIncluder.#readYaml` — `readFileSync` → `new EnvStringResolver(content).resolve()`
  → `YAML.parse(...)` — not the whole include-chain/namespace machinery. The menu
  file has no `include:` support by design.
- **`NAVI_MENU` path value:** SPEC-1 literally says `/navi/menu.yml`, but the
  repo's actual precedent (`NAVI_CONFIG=./config/web.yml` + `COPY … /home/node/app/config/web.yml`)
  is `./config/…`. This plan follows the repo precedent (`./config/menu.yml`) for
  consistency; call it out in the PR description as a deliberate deviation from
  the SPEC's example path.
- **Startup threading is the riskiest part:** the menu path must travel
  `bin/navi.js` → `Application.loadConfig` → `ApplicationInstance.loadConfig` →
  `ApplicationConfigurator.load` → `ConfigStore` → `ApplicationInstance.run()` →
  `ServerController.build` → `ServerController.buildWebServer` → `WebServer`
  constructor → `new Router(...)`. Every one of those has a spec that will need a
  new argument threaded through. Keep the parsed menu config a plain value object
  carried alongside `webConfig`, not folded into the `Config` model.
- `HashRouter` is used, and `<MenuMenu />` renders inside `Layout` (a routed
  component), so `react-router-dom` `<Link>` works for internal entries.
