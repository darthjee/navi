# Feature: Config-driven internal menu

Part of #794 (**menu track**). This document is transient design material: it is
removed by CLEAN-1 (#807) once the feature ships, with anything lasting folded into
`docs/agents/frontend.md` / `docs/agents/web-server.md` / a user guide.

> **Depends on #795 (SPEC-1).** SPEC-1 owns the menu configuration *file* — its
> filename, format, default + configurable load path, Docker-volume mounting, the
> single-entry shape, and the Logs/Memory defaults. At the time this section was
> written SPEC-1 was not yet merged, so the skeleton below is aligned to the
> description in #794/#795; exact field names and the filename should be
> reconciled with SPEC-1 once it lands. Where the two documents overlap, **SPEC-1's
> decisions win** and this one references them.

## SPEC-1 skeleton (placeholder — reconcile with #795)

Navi's internal navigation is currently hard-coded: **Logs** and **Memory** are
`<StatItem>` cards in `frontend/src/components/elements/StatsDisplay.jsx`, and their
routes are literal `<Route>` elements in `frontend/src/main.jsx`. External links are
already config-driven (`web.links` → `source/lib/server/handlers/LinksHandler.js` →
`GET /links.json` → `frontend/src/clients/LinksClient.js` → `LinksMenu`), which is
the precedent the menu work follows.

SPEC-1 introduces a **dedicated configuration file** (separate from the main Navi
YAML) that drives the internal menu:

- **File** — a YAML file (parsed with the existing
  `source/lib/services/config/ConfigIncluder.js` machinery), at a default path that
  is overridable via configuration and mountable through a Docker volume. Exact
  filename and key: **SPEC-1's call**. This document uses `menu.yml` and a top-level
  `entries:` list purely as placeholders.
- **Entry shape** — `{ route, text }` per entry. `route` is an internal app route
  (leading `/`, e.g. `/logs`); `text` is the visible label and defaults to `route`
  when omitted (mirroring `Link.fromObject()` defaulting `text` to `url`). Optional
  presentational fields (icon, group) are **out of scope for v1** — see
  [Rendering limits](#rendering-limits).
- **Defaults** — the stock file ships two entries so zero-config behaviour is
  unchanged:

  ```yaml
  entries:
    - route: /logs
      text: Logs
    - route: /memory/status
      text: Memory
  ```

- **Serving path** — a handler + route (placeholder `/menu.json`) wired into
  `source/lib/server/Router.js` next to `/links.json`, with a `Serializer` subclass
  emitting plain `{ route, text }`. SPEC-1 decides `/menu.json` vs. extending
  `/links.json`.
- **Backward compatibility** — file absent or empty ⇒ the two defaults above, i.e.
  today's menu.

Everything from here down is **this issue's** contribution (#796): what happens once
the file contains more than the defaults.

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
file-level error and follows SPEC-1's file-level policy (recommended: fail-fast,
same as the main config). Only *individual entries* get the lenient skip-and-warn
treatment.

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

- **SPEC-1 (#795)** — the base menu configuration file: format, path, entry shape,
  defaults. This section extends its output file.
- **IMPL-1 (#801)** — makes the menu config-driven and removes the hard-coded
  `StatsDisplay` Logs/Memory cards.
- **IMPL-2 (#802)** — implements everything in this section (merge/replace,
  ordering, per-entry validation, duplicate/collision handling, scrolling panel).
- **IMPL-3 / IMPL-4 (#803 / #804)** — the separate extra-internal-routes track a
  custom entry may target.
- **CLEAN-1 (#807)** — deletes this document once the feature ships.
