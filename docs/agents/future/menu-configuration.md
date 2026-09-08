# Feature: Config-driven internal menu

Part of #794 (**menu track**). This document is transient design material: it is
removed by CLEAN-1 (#807) once the feature ships, with anything lasting folded into
`docs/agents/frontend.md` / `docs/agents/web-server.md` / a user guide.

SPEC-1 (#795) is settled; its decisions are recorded in
[Menu configuration file](#menu-configuration-file) below. Where that section and
the [Operator-supplied entries](#operator-supplied-entries) section (#796) overlap,
**SPEC-1's decisions win** and #796 references them.

## Menu configuration file

Navi's internal navigation is currently hard-coded: **Logs** and **Memory** are
`<StatItem>` cards in `frontend/src/components/elements/StatsDisplay.jsx`, and their
routes are literal `<Route>` elements in `frontend/src/main.jsx`. External links are
already config-driven (`web.links` → `source/lib/models/configs/Link.js` →
`source/lib/server/handlers/LinksHandler.js` → `GET /links.json` →
`frontend/src/clients/LinksClient.js` → `LinksMenu`), which is the precedent this
feature follows.

SPEC-1 introduces a **dedicated configuration file** (separate from the main Navi
YAML) that drives the internal menu. This section is the complete contract IMPL-1
(#801) implements; every point below lands on a single concrete decision.

### Current architecture (context)

- **Hard-coded menu**: `<StatItem label="Logs" to="/logs" />` and
  `<StatItem label="Memory" to="/memory/status" />` in
  `frontend/src/components/elements/StatsDisplay.jsx`; the routes themselves are
  literal `<Route>` elements in `frontend/src/main.jsx`.
- **External-links precedent**: YAML `web.links` → `WebConfig.links` (built via
  `Link.fromObject()`, which accepts a bare string or `{ url, text }` and defaults
  `text` to `url`) → `HandlerConfig(LinksHandler, [links])` in
  `source/lib/server/Router.js` → `GET /links.json` (`LinksSerializer extends
  Serializer`, `toJSON` → `{ url, text }`) → `frontend/src/clients/LinksClient.js`
  → `LinksMenu` / `LinksMenuController` / `LinksMenuHelper` / `LinksDropdown` /
  `LinksDropdownItem` (a Bootstrap dropdown, flat `<ul>` of `dropdown-item` links).
- **Config-path precedent**: the main config file is a CLI option —
  `source/lib/services/application/ArgumentsParser.js` defines `-c` / `--config`
  (default `config/navi_config.yml`); `source/bin/navi.js` calls
  `ArgumentsParser.parse(process.argv.slice(2))` then `Application.loadConfig`. The
  prod image (`dockerfiles/production_navi_hey/Dockerfile`) sets
  `ENV NAVI_CONFIG=...` and its `CMD` runs `navi-hey -c $NAVI_CONFIG`.
- **YAML parsing**: `source/lib/services/config/ConfigIncluder.js` parses YAML and
  resolves `${VAR}` via `EnvStringResolver`; its `include:` chain support is
  main-config-only.

### File & format

**Decision:** `config/menu.yml`, a flat YAML document, sitting beside the main
`config/navi_config.yml`.

- Parsed with the existing `ConfigIncluder` / `EnvStringResolver` machinery, so
  `${VAR}` interpolation works inside the file (e.g.
  `route: ${DASHBOARD_URL}`). Rationale: one YAML-parsing path across Navi; an
  operator's mental model for `navi_config.yml` carries over unchanged.
- **No `include:` chain.** The menu file is a single self-contained document; the
  `include:` mechanism stays a main-config-only feature. A menu is a short flat
  list — a multi-file chain would be complexity with no payoff.

Example file:

```yaml
entries:
  - route: /logs
    text: Logs
  - route: /memory/status
    text: Memory
  - route: /dashboard
    text: Dashboard
  - route: ${STATUS_PAGE_URL}
    text: Status page
```

### Path configuration

**Decision:** a new CLI option `-m` / `--menu` (default `config/menu.yml`),
mirroring `-c` / `--config` exactly.

- `source/lib/services/application/ArgumentsParser.js` gains an `-m` / `--menu`
  string option with `DEFAULT_MENU_FILE = 'config/menu.yml'`, added the same way
  `-c` / `--config` is.
- `source/bin/navi.js` threads the parsed value through to
  `Application.loadConfig` alongside the main config path; the menu file is loaded
  once at startup, next to the main config.
- The prod image (`dockerfiles/production_navi_hey/Dockerfile`) gains
  `ENV NAVI_MENU=/navi/menu.yml` and its `CMD` passes `-m $NAVI_MENU`, exactly
  parallel to `NAVI_CONFIG` / `-c $NAVI_CONFIG`.
- **Operator override:** mount a file at the container path and/or set one env var:

  ```yaml
  services:
    navi:
      volumes:
        - ./my-menu.yml:/navi/menu.yml
      # or, to relocate it:
      # environment:
      #   NAVI_MENU: /config/menu.yml
  ```

Rationale: reuses the dominant Navi pattern for "path to a config file"; keeps the
menu file a first-class sibling of the main config rather than an env-only special
case (contrast the extension track's `NAVI_EXTENSIONS_DIR`, which has no file-path
precedent to reuse).

### Entry shape

**Decision:** ratified as-is from #796. Top-level `entries:` list; each entry is
`{ route, text[, hidden] }`.

| Field | Required | Constraint |
|---|---|---|
| `route` | yes | non-empty string; either starts with `/` (internal route) or is an absolute `http(s)://` URL (external). No whitespace. |
| `text` | no | non-empty string; the visible label. Defaults to `route` when omitted (mirrors `Link.fromObject()` defaulting `text` to `url`). |
| `hidden` | no | boolean; only meaningful when `route` matches a known default — see [Operator-supplied entries](#operator-supplied-entries). |

`icon`, `group`, and `order` are **out of scope** (deferred by #796 — see
[Rendering limits](#rendering-limits)). A bare string entry shorthand is **not**
supported for the menu file; unlike `web.links`, every menu entry is a mapping.

### Defaults

**Decision:** a stock `config/menu.yml` ships in the package with exactly the two
entries that reproduce today's menu:

```yaml
entries:
  - route: /logs
    text: Logs
  - route: /memory/status
    text: Memory
```

The **absent or empty** file resolves to those same two entries **in code** (the
menu loader owns the fallback constant), so a deployment that deletes or blanks the
file still gets today's menu rather than an empty one. The shipped file exists so
an operator has something concrete to copy and edit.

### Serving path

**Decision:** a **new `GET /menu.json`** endpoint. `/links.json` is untouched.

- `source/lib/server/Router.js` `build()` gains
  `'/menu.json': new HandlerConfig(MenuHandler, [menuConfig])` next to the
  `/links.json` line; `Router` receives the parsed menu config as a constructor
  parameter alongside `webConfig`.
- `MenuHandler` (`source/lib/server/handlers/MenuHandler.js`) is modeled on
  `LinksHandler` — it takes the menu config and responds with the serialized menu.
- `MenuSerializer extends Serializer` (`source/lib/serializers/MenuSerializer.js`),
  modeled on `LinksSerializer`, emits:

  ```json
  { "entries": [ { "route": "/logs", "text": "Logs" }, { "route": "/memory/status", "text": "Memory" } ] }
  ```

  `hidden` and `defaults` are resolved during load, not serialized — the response
  is the final render list, in render order.

Rationale for a separate endpoint over extending `/links.json`: the two surfaces
have different response shapes (`{ url, text }` vs `{ route, text }`) and different
meanings (external links vs internal navigation). Folding them together would force
a discriminator field and complicate both the serializer and the two independent
frontend consumers.

### Frontend consumption

**Decision:** a new `frontend/src/clients/MenuClient.js` plus a dedicated menu
dropdown, rendered in `Layout.jsx` next to the existing `Links` dropdown.

- `frontend/src/clients/MenuClient.js` — `fetch('/menu.json')` → `data.entries`,
  the same shape as `LinksClient.js` against `/links.json` → `data.links`.
- The internal menu renders as **its own Bootstrap dropdown**, built from the
  existing `LinksDropdown` / `LinksDropdownItem` primitives (either reused directly
  or via a thin `MenuDropdown` clone of the `LinksMenu*` family), placed in
  `frontend/src/components/pages/Layout.jsx` beside `<LinksMenu />` in the header.
- IMPL-1 **removes** the two `StatItem` cards
  (`<StatItem label="Logs" .../>` / `Memory`) from
  `frontend/src/components/elements/StatsDisplay.jsx`; the literal `<Route>`s in
  `frontend/src/main.jsx` stay (the pages still exist — only their menu entry
  points move into the config-driven dropdown).
- The built SPA is committed into `source/static/`, so IMPL-1 rebuilds the
  frontend as part of its change.

### Relationship to `web.links`

**Decision:** the two stay **separate surfaces**. No migration of `web.links`, no
compatibility shim.

- `web.links` (YAML `web.links` → `/links.json` → `Links` dropdown) remains the
  **external links** menu.
- `config/menu.yml` → `/menu.json` → the new dropdown is the **navigate within
  Navi** menu (which may still contain the odd absolute URL).

Rationale: two small single-purpose files each with an obvious owner beat one
overloaded file with a `kind:` discriminator. An operator who wants a link in both
menus lists it in both — cheaper than the reconciliation logic a merged file would
need.

### Backward compatibility & error policy

- **Absent or empty file ⇒ the two defaults** (Logs, Memory). Not an error.
- **Present but unparseable ⇒ fail-fast.** Bad YAML, or `entries` present but not a
  list, is a **file-level error** that aborts startup with a typed error, the same
  posture as `ConfigLoader` / `ConfigIncluder` on a broken main config
  (`MissingTopLevelConfigKey`, `ConfigurationFileNotFound`, …). An operator who
  mounted a menu file and broke it should see it immediately, not silently get the
  defaults back.
- **Individual bad entry ⇒ skip-and-warn.** A single malformed entry (missing
  `route`, wrong type, unknown key, …) is dropped, a `Logger.warn` is emitted, and
  the rest of the menu builds normally — the menu is cosmetic and must never take
  the server down. This lenient per-entry handling is #796's territory; see
  [Validation](#validation) for the full rules.

---

## Operator-supplied entries

This section pins down the behaviour when an operator edits the mounted menu file to
add, remove, reorder, or override entries. Each subsection lands on a single
concrete rule so IMPL-2 (#802) can implement and test it without re-deciding
anything.

### Adding entries

**Rule: merge with defaults.** The operator's file is *appended* to the shipped
Logs/Memory defaults; the operator never re-declares the defaults just to add
something.

Default file (shipped in the image):

```yaml
entries:
  - route: /logs
    text: Logs
  - route: /memory/status
    text: Memory
```

Operator's mounted file, adding two entries:

```yaml
entries:
  - route: /dashboard
    text: Dashboard
  - route: https://status.example.com
    text: Status page
```

Resulting menu: **Logs, Memory, Dashboard, Status page** — defaults first, custom
entries after, in file order.

**Full-replace opt-out.** A top-level `defaults: false` drops *both* shipped
defaults; only the operator's `entries` render:

```yaml
defaults: false
entries:
  - route: /dashboard
    text: Dashboard
```

Resulting menu: **Dashboard** only.

**Hiding one default.** To drop just one default, add an entry that targets its
`route` with `hidden: true`:

```yaml
entries:
  - route: /memory/status
    hidden: true
  - route: /dashboard
    text: Dashboard
```

Resulting menu: **Logs, Dashboard**. `hidden: true` on a `route` that is not a known
default is a no-op (skip-and-warn — see [Validation](#validation)).

There is **no `order` key** and no "insert default at position N" syntax in v1. The
three levers above (append, `defaults: false`, per-entry `hidden`) plus repositioning
by re-listing (below) are the whole surface.

### Ordering

**Rule: file order determines render order.** Defaults render first (in their shipped
order), then custom entries in the order they appear in the operator's file.

**Repositioning a default.** If the operator re-lists a default `route` as one of
their own entries, that default moves to the custom entry's file position instead of
rendering in the default block. It is **not** duplicated (see
[Collision with defaults](#collision-with-defaults)). Example:

```yaml
entries:
  - route: /dashboard
    text: Dashboard
  - route: /logs
    text: Logs
```

Resulting menu: **Memory, Dashboard, Logs** — `Memory` is the only default left in
the default block; `/logs` is pulled down to its re-listed position.

Rationale for no `order` key: it adds a second source of truth that has to be
reconciled with file order on every render, for a menu that is expected to hold a
handful of entries. File order is already unambiguous and is what the operator sees
when editing the file.

### Validation

Applied **per entry**, after the file as a whole has parsed successfully.

**Required / optional fields**

| Field | Required | Constraint |
|---|---|---|
| `route` | yes | non-empty string; either starts with `/` (internal route) or is an absolute `http(s)://` URL (external). No whitespace. |
| `text` | no | non-empty string; defaults to `route` when omitted. |
| `hidden` | no | boolean; only meaningful when `route` matches a known default. |

**Malformed individual entry ⇒ skip-and-warn.** An entry that fails the table above
(missing `route`, `route` not a string, `route` with whitespace, `hidden` not a
boolean, unknown keys) is **dropped**, a warning is logged via
`source/lib/utils/logging/Logger.js` (`Logger.warn`), and the rest of the menu is
built normally. The menu is cosmetic and must **never** take the server down.

Example warning string (IMPL-2 may refine wording, not severity):

```
[menu] skipping invalid entry at index 3: "route" is required and must be a path or URL
```

This deliberately **diverges** from Navi's config-loading norm. `ConfigLoader` /
`ConfigIncluder` are fail-fast — they throw typed errors
(`MissingTopLevelConfigKey`, `ConfigurationFileNotFound`,
`ConfigurationIncludeNotFound`) and abort startup on a bad main config. That
fail-fast policy still applies to the **menu file as a whole**: if the file is
present but not parseable as YAML, or `entries` is present but not a list, that is a
file-level error and SPEC-1 fixes it as **fail-fast**, same as the main config (see
[Backward compatibility & error policy](#backward-compatibility--error-policy)).
Only *individual entries* get the lenient skip-and-warn treatment.

`Logger.warn` skip-and-continue already has precedent in
`source/lib/parsers/css_selector_parser/FilterMatcher.js` and
`source/lib/utils/HtmlElementParser.js`.

### Collision with defaults

**Custom entry reuses a default `route`** (`/logs` or `/memory/status`): treated as
a **reposition + override** of that default, not a duplicate.

- The default is removed from the default block.
- The custom entry renders at its own file position.
- The custom entry's `text` wins (so an operator can relabel `Logs` → `Server logs`).
- A bare re-list with no `text` keeps the default label.

This is the same mechanism as [Ordering](#ordering)'s repositioning, stated from the
collision angle.

**Custom entry reuses a default's *text* on a different `route`** (e.g.
`{ route: /audit, text: Logs }`): **allowed, no warning.** `text` is a free-form
label; only `route` is an identity. IMPL-2 does not dedupe or warn on text.

**Duplicate `route` among entries generally** (default-vs-custom or custom-vs-custom):
**first occurrence wins**; every later entry with the same `route` is skipped with a
`Logger.warn`:

```
[menu] skipping duplicate entry at index 5: route "/dashboard" already defined at index 2
```

"First" is evaluated over the merged list *in render order* — i.e. after
`defaults: false` / `hidden` have been applied and custom entries appended — so a
custom re-list of `/logs` is the "first" `/logs` only when `defaults: false` or a
`hidden` on `/logs` removed the shipped one; otherwise the shipped default is first
and the custom re-list is what repositions it (the reposition case above is
distinguished from a plain duplicate by the `route` matching a *known default*).

### Rendering limits

Current UI: `LinksMenu` → `LinksMenuHelper` → `LinksDropdown` → `LinksDropdownItem`
render a single Bootstrap dropdown button whose panel is a flat `<ul>` of `<a
class="dropdown-item">` rows. The menu produced by this feature renders the same
way.

**Rule: no hard cap on entry count.** A long list makes the dropdown panel tall; the
fix is a scrolling panel, not a limit. IMPL-2 should give the dropdown panel a
`max-height` (roughly the viewport height minus the navbar) plus
`overflow-y: auto`. That is a **UI detail for IMPL-2**, not a config concern, and
not something the menu file can influence.

**Explicitly deferred, recorded as future work:**

- grouping / section headers within the dropdown
- nested / fly-out submenus
- per-entry icons
- an explicit `order` key

None of these are half-specified here. If one is genuinely needed, it gets its own
`docs/agents/future/` note and its own issue under #794 — not a widening of this
document.

### Interaction with the extension track

A custom entry may point at a route that IMPL-3 / IMPL-4 (#803 / #804) register
(the "extra internal routes" track).

- The **menu config file and the extra-routes config file are separate schemas.**
  Neither validates against the other. IMPL-2 does not check that a menu entry's
  `route` corresponds to a registered route, and the routes feature does not read
  the menu file.
- **Ordering dependency (informational):** a menu entry is only *useful* once its
  target route exists. An entry whose `route` is not yet registered is **not a
  config error** — it renders as an ordinary link that, when clicked, 404s or shows
  the SPA fallback, exactly like a mistyped `web.links` URL today.
- Operator guidance: register the route first (via the extra-routes file), then add
  the menu entry.

---

## Cross-references

- **SPEC-1 (#795)** — the base menu configuration file: `config/menu.yml`, `-m` /
  `--menu` CLI option, `{ route, text }` entry shape, Logs/Memory defaults, new
  `GET /menu.json` endpoint, `MenuClient` + dropdown. Recorded in
  [Menu configuration file](#menu-configuration-file) above; the
  [Operator-supplied entries](#operator-supplied-entries) section extends it.
- **IMPL-1 (#801)** — makes the menu config-driven and removes the hard-coded
  `StatsDisplay` Logs/Memory cards.
- **IMPL-2 (#802)** — implements everything in this section (merge/replace,
  ordering, per-entry validation, duplicate/collision handling, scrolling panel).
- **IMPL-3 / IMPL-4 (#803 / #804)** — the separate extra-internal-routes track a
  custom entry may target.
- **SPEC-5 (#799)** — the downstream-developer extension workflow
  ([`downstream-extension-workflow.md`](downstream-extension-workflow.md) and the
  [`docs/guides/navi/extending-navi.md`](../../guides/navi/extending-navi.md)
  guide) shows adding a `config/menu.yml` `{ route, text }` entry for an extension
  route, and relies on SPEC-4's client-side auto-append of extension entries.
- **CLEAN-1 (#807)** — deletes this document once the feature ships.
