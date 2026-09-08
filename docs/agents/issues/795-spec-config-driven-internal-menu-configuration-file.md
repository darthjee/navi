# Issue: SPEC: config-driven internal menu configuration file

## Description

Spec issue — part of #794, **menu track**. No production code. Removed by CLEAN-1
(#807) once the feature ships.

`docs/agents/future/menu-configuration.md` **already exists** — SPEC-2 (#796,
merged) created it with a placeholder *"SPEC-1 skeleton (placeholder — reconcile
with #795)"* section plus the full "Operator-supplied entries" section that builds
on it. This issue **replaces that placeholder** with the finalized spec for the
menu configuration file and drops the `> Depends on #795` caveat, reconciling any
field-name / filename drift so #796's section sits on solid ground.

SPEC-2 already committed (and this issue must ratify or consciously change) the
following, since its section depends on them:

- Top-level `entries:` list; per-entry `{ route, text }`.
- `route` is either an internal path (leading `/`) or an absolute `http(s)://` URL;
  `text` defaults to `route` when omitted (mirrors `Link.fromObject()`).
- Stock defaults: `{ /logs, Logs }` and `{ /memory/status, Memory }`.
- File-level `defaults: false` and per-entry `hidden: true` are reserved keys.
- File absent or empty ⇒ the two defaults (today's menu).
- Individual bad entry ⇒ skip-and-warn (`Logger.warn`); the menu never crashes
  the server.

## Current architecture (context)

- Hard-coded menu: `<StatItem label="Logs" to="/logs" />` and
  `<StatItem label="Memory" to="/memory/status" />` in
  `frontend/src/components/elements/StatsDisplay.jsx`; routes are literal
  `<Route>`s in `frontend/src/main.jsx`.
- External-links precedent: YAML `web.links` → `WebConfig.links`
  (`Link.fromObject`) → `HandlerConfig(LinksHandler, [links])` in
  `source/lib/server/Router.js` → `GET /links.json`
  (`LinksSerializer` → `{ url, text }`) → `frontend/src/clients/LinksClient.js`
  → `LinksMenu` → `LinksDropdown` (a Bootstrap dropdown, flat `<ul>` of
  `dropdown-item` links).
- Config-path precedent: the **main** config file is a CLI option —
  `source/lib/services/application/ArgumentsParser.js` defines
  `-c/--config` (default `config/navi_config.yml`); the prod image
  (`dockerfiles/production_navi_hey/Dockerfile`) sets `ENV NAVI_CONFIG=...` and
  runs `navi-hey -c $NAVI_CONFIG`.
- Env-var precedent: `BaseLogger` reads `process.env.LOG_LEVEL` directly; the
  extension track (#797/#798) added `NAVI_EXTENSIONS_ENABLED` / `NAVI_EXTENSIONS_DIR`
  as direct env reads.
- YAML parsing: `source/lib/services/config/ConfigIncluder.js` parses YAML and
  resolves `${VAR}` via `EnvStringResolver`, and supports an `include:` chain for
  the main config.

## Problem

The menu-configuration doc's SPEC-1 section is still a placeholder. Until it is
finalized:

- The **filename and default path** of the menu file, and **how an operator points
  Navi at a mounted one**, are undecided.
- Whether the menu is served by a **new endpoint** or folded into `/links.json` is
  undecided.
- **How the internal menu renders** in the SPA (dropdown? nav items? merged with
  the Links dropdown?) — which drives IMPL-1 (#801) — is undecided.
- The **file-level error policy** (unparseable file: fail-fast vs. fall back to
  defaults) is only "recommended" in #796, not fixed.
- The **relationship to `web.links`** is unstated.

IMPL-1 (#801) is blocked on all of the above; #796's already-merged section has a
dangling `Depends on #795` caveat.

## Expected Behavior

Deliverable: replace the *"SPEC-1 skeleton (placeholder)"* section of
`docs/agents/future/menu-configuration.md` with a finalized spec, remove the
`> Depends on #795` blockquote, and reconcile naming with the "Operator-supplied
entries" section. It must cover:

- **File format & filename** — YAML (parsed with the existing `ConfigIncluder` /
  `EnvStringResolver` machinery); the exact filename and default path; whether
  `${VAR}` interpolation applies (recommend yes) and whether the `include:` chain
  applies (recommend no — flat single file).
- **Path configuration** — the one mechanism an operator uses to point Navi at a
  mounted menu file, and its default. Land on one of: a new CLI option (like
  `-c`), a direct env var (like the extension track), or a `web.*` YAML key.
- **Entry shape** — ratify `{ route, text }`, `route` = internal path or absolute
  URL, `text` default. State that `icon` / `group` / `order` are **out of scope**
  (already deferred by #796).
- **Defaults** — the stock file content (`/logs` Logs, `/memory/status` Memory)
  and where it lives in the image.
- **Serving path** — new `GET /menu.json` handler + `Serializer` subclass wired
  into `source/lib/server/Router.js` next to `/links.json`, vs. extending
  `/links.json`. Land on one; specify the response shape.
- **Frontend consumption** — the new client module and **how the menu renders** in
  the SPA, replacing the hard-coded `StatsDisplay` Logs/Memory cards. This is the
  concrete contract IMPL-1 implements.
- **Relationship to `web.links`** — do external links fold into the menu file or
  stay a separate surface? Recommend one, with rationale.
- **Backward compatibility & error policy** — ratify "absent/empty ⇒ defaults";
  fix the file-level policy for a present-but-unparseable file (fail-fast vs.
  fall-back-to-defaults), stated against `ConfigLoader`'s fail-fast norm.

Every point lands on a concrete recommendation, not an options list.

## Solution

Positions to document (settled in discussion on this issue):

- **Filename & format**: `config/menu.yml` (YAML), sitting beside the main
  `config/navi_config.yml`. Parsed with `ConfigIncluder`/`EnvStringResolver` so
  `${VAR}` interpolation works; **no `include:` chain** — the menu file is a flat
  single document.
- **Path configuration**: a new CLI option `-m` / `--menu` (default
  `config/menu.yml`), mirroring `-c` / `--config` exactly. The prod image sets
  `ENV NAVI_MENU=/navi/menu.yml` and the `CMD` passes `-m $NAVI_MENU`, so an
  operator overrides it by mounting a file and/or setting one env var. Rationale:
  reuses the dominant Navi pattern for "path to a config file"; keeps the menu
  file a first-class sibling of the main config rather than an env-only special
  case.
- **Entry shape**: ratified as-is from #796 — `entries:` list of
  `{ route, text[, hidden] }`; `route` internal path or absolute `http(s)://`;
  `text` defaults to `route`. `icon` / `group` / `order` remain out of scope.
- **Defaults**: a stock `config/menu.yml` shipped in the package with exactly the
  two entries (`/logs` Logs, `/memory/status` Memory). Absent/empty file ⇒ those
  two defaults, in-code.
- **Serving path**: a **new `GET /menu.json`** endpoint —
  `HandlerConfig(MenuHandler, [menuConfig])` in `Router.build()` next to
  `/links.json`, a `MenuSerializer extends Serializer` emitting
  `{ entries: [{ route, text }] }`. `/links.json` is untouched.
- **Frontend consumption**: a new `frontend/src/clients/MenuClient.js`
  (`GET /menu.json`), and the internal menu renders as its **own Bootstrap
  dropdown** built from the same `LinksDropdown` primitives, sitting next to the
  existing `Links` dropdown in `Layout`. IMPL-1 removes the two `StatItem` cards
  from `StatsDisplay.jsx`.
- **Relationship to `web.links`**: **stay separate**. `web.links` remains the
  "external links" dropdown; `/menu.json` is the "navigate within Navi" menu
  (which may still contain the odd external URL). Two small, single-purpose
  surfaces beat one overloaded file; no migration of `web.links` in this feature.
- **Error policy**: **fail-fast** for a present-but-unparseable menu file (bad
  YAML, or `entries` not a list) — an operator who mounted a menu file and broke
  it should see an immediate startup error, same posture as `ConfigLoader`. Only
  *individual* entries get #796's lenient skip-and-warn. Absent/empty is not an
  error (⇒ defaults).

## Benefits

- IMPL-1 (#801) gets a complete contract: filename, path mechanism, endpoint,
  serializer shape, client, and the exact UI change.
- #796's merged "Operator-supplied entries" section loses its `Depends on #795`
  caveat and rests on ratified field names.
- Reuses the two established Navi patterns unchanged — `-c`-style CLI option for
  the file path, `LinksHandler`/`LinksDropdown` for serving and rendering — so
  there is little new surface to learn or test.
- Keeps `web.links` and the internal menu as separate, single-purpose surfaces,
  avoiding a migration and a compatibility shim.
