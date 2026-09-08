# Issue: Support arbitrary additional menu entries from the config file

## Description

Part of #794 (**menu track**). Implementation issue **IMPL-2** for **SPEC-2 (#796)**,
whose settled contract lives in `docs/agents/future/menu-configuration.md` -> the
"Operator-supplied entries" section.

IMPL-1 (#801, merged) made the internal navigation menu render from a dedicated
`config/menu.yml` file: `MenuConfig.fromFile()` -> `MenuEntry` models ->
`GET /menu.json` -> `MenuClient` -> the `MenuMenu` / `MenuDropdown` header dropdown.
IMPL-1 ships Logs + Memory as the stock entries, does per-entry skip-and-warn
validation, and fails fast on an unparseable file. It **accepts** the `hidden` key
(type-checked in `MenuEntry`) but leaves it **inert**, and it does **not** merge,
de-duplicate, reposition, or honour a `defaults` switch.

This issue layers the operator-facing semantics on top of that pipeline: how an
operator grows the menu with arbitrary additional entries, and how Navi resolves
merge/replace, ordering, duplicates, and collisions when they do -- exactly as
SPEC-2 (#796) settled them.

Note: the original GitHub description referenced `#794` for both "SPEC-2" and
"IMPL-1"; the real issues are **#796** and **#801**.

## Problem

After IMPL-1, an operator who mounts their own `config/menu.yml` gets a menu built
**only** from that file. They must re-declare Logs and Memory just to add one entry,
there is no way to drop a default, `hidden: true` does nothing, a duplicate `route`
renders twice, and the dropdown panel grows unbounded with no scroll. SPEC-2's
decisions -- merge-with-defaults, `defaults: false`, per-entry `hidden`, file-order
rendering, first-wins de-duplication, scrolling panel -- are documented but
unimplemented.

## Expected Behavior

All rules below are ratified in SPEC-2 (#796) / `docs/agents/future/menu-configuration.md`.

**Merge with defaults**
- An operator `config/menu.yml` is **appended** to the shipped Logs/Memory defaults:
  defaults first (shipped order), then custom entries in file order.
- Given default `[Logs, Memory]` and operator file `[Dashboard, Status page]`, the
  menu renders **Logs, Memory, Dashboard, Status page**.

**Full replace**
- A top-level `defaults: false` drops **both** shipped defaults; only the operator's
  `entries` render. `defaults` must be a boolean.
- `defaults: false` is the **only** way to empty the menu. An explicit `entries: []`
  (with `defaults` absent or `true`) still renders Logs + Memory -- an empty custom
  list, not a wipe. This deliberately reverses IMPL-1, where `entries: []` produced
  an empty menu.

**Hiding one default**
- An entry targeting a known default `route` (`/logs` or `/memory/status`) with
  `hidden: true` removes just that default.
- `hidden: true` on a `route` that is not a known default is a no-op and is
  skipped-and-warned.

**Ordering / repositioning**
- File order determines render order.
- If a custom entry re-lists a known default `route`, that default is pulled out of
  the default block and rendered at the custom entry's file position -- **not
  duplicated**. The custom entry's `text` wins (relabel `Logs` -> `Server logs`); a
  bare re-list with no `text` keeps the default label.
- Example: operator file `[Dashboard, /logs]` -> menu renders **Memory, Dashboard, Logs**.

**Duplicate `route`**
- Evaluated over the merged list in render order: first occurrence wins, every later
  entry with the same `route` is dropped with a `Logger.warn`, e.g.
  `[menu] skipping duplicate entry at index 5: route "/dashboard" already defined at index 2`.
- The `index` values in these new warnings count position in the **merged
  render-order list** (defaults prepended), matching SPEC-2's example text. IMPL-1's
  existing invalid-entry warning keeps its raw `entries`-array index.
- A re-list of a known default `route` is the *reposition* case above, not a
  duplicate.

**Text collisions**
- A custom entry reusing a default's **text** on a different `route`
  (`{ route: /audit, text: Logs }`) is allowed with no warning -- only `route` is an
  identity.

**Rendering limits (frontend)**
- No hard cap on entry count. The dropdown panel gets a `max-height` (~viewport minus
  navbar) plus `overflow-y: auto` so a long list scrolls.
- Grouping, nested submenus, per-entry icons and an explicit `order` key stay **out
  of scope** (recorded as future work in SPEC-2).

**Non-goals**
- No change to `web.links` / `/links.json`.
- `hidden` / `defaults` are resolved at load time; `GET /menu.json` still returns the
  final `{ entries: [{ route, text }] }` render list, in render order.
- Deleting `docs/agents/future/menu-configuration.md` is CLEAN-1 (#807), not this issue.

## Acceptance criteria

- [ ] A mounted file with N custom entries renders all N after the defaults, in file
      order.
- [ ] `defaults: false` renders only the operator's entries.
- [ ] `hidden: true` on a default `route` removes that default; on a non-default
      `route` it is dropped with a warning.
- [ ] Re-listing a default `route` repositions it (no duplicate) and honours a
      supplied `text`.
- [ ] Duplicate non-default `route` -> first wins, later dropped with a warning
      whose `index` values count merged render-order position.
- [ ] `entries: []` with no `defaults: false` still renders Logs + Memory.
- [ ] The dropdown panel scrolls with a long list; no entry-count limit.
- [ ] Specs cover merge, `defaults: false`, `hidden`, ordering/repositioning,
      duplicate/collision, and many-entry rendering.
- [ ] `yarn lint` / `yarn test` pass in `source/` and `frontend/`.
- [ ] An operator-facing guide documents the format.

## Solution

### Backend (`engine`)

- **`source/lib/models/configs/MenuConfig.js`**
  - Introduce the known-default identity set (routes `/logs`, `/memory/status`)
    alongside the existing `DEFAULT_ENTRIES` fallback.
  - Recognise the top-level `defaults` key (boolean, default `true`).
    `defaults: false` -> skip the shipped defaults entirely.
  - Build the render list as: shipped defaults (unless `defaults: false`), minus any
    default whose `route` is targeted by `hidden: true` or re-listed by a custom
    entry; then custom entries in file order, with a re-listed default spliced in at
    its custom position and its `text` overridden when supplied.
  - De-duplicate the merged list by `route`: first wins, later dropped with
    `Logger.warn`; the warning's `index` values count merged render-order position.
  - `hidden: true` against a non-default `route`: drop + `Logger.warn`.
  - `entries: []` now merges as an empty custom list -> defaults still render. Only
    `defaults: false` yields an empty menu. This changes IMPL-1's current
    `#buildEntries([]) -> []` result and its docstring/spec.
  - Preserve IMPL-1 behaviour: absent/empty/`entries`-less file -> defaults;
    unparseable file or non-list `entries` -> `throw MenuConfigurationInvalid`.
- **`source/lib/models/configs/MenuEntry.js`**
  - `hidden` stays an accepted, type-checked key; `MenuConfig` now consumes it.
    `fromObject` currently drops `hidden` -- carry it through as needed.
  - Decide validation messaging for a non-boolean top-level `defaults`.
- **`MenuHandler` / `MenuSerializer` / `Router`**: unchanged -- they already serialise
  the final `{ route, text }` list.

### Frontend (`frontend`)

- **`MenuDropdownHelper.jsx`** / **`MenuDropdown.jsx`**: give the
  `<ul class="dropdown-menu show">` a `max-height` (e.g. `calc(100vh - <navbar>)`)
  and `overflow-y: auto`. No entry-count limit.
- No change to `MenuClient` / `MenuMenu` data flow -- the server returns the resolved
  list.
- Rebuild the SPA into `source/static/` and commit the build output.

### Tests

- **Backend (`source/spec/`)**, extending `MenuConfig_spec.js` / `MenuEntry_spec.js`:
  merge ordering; `defaults: false`; `hidden` removing one default; `hidden` on a
  non-default (drop + warn); repositioning by re-list (no duplicate, text override,
  bare re-list keeps label); duplicate non-default `route` (first wins + warn);
  text-collision-on-different-route allowed; `entries: []` -> defaults remain;
  non-boolean `defaults` handling. Update the existing `entries: []` spec that
  currently asserts an empty menu.
- **Frontend (`frontend/spec/`)**, extending `MenuMenu_spec.js` /
  `MenuDropdown_spec.js`: renders N entries from `/menu.json`; long list keeps the
  panel scrollable.

### Docs (`docs`)

- Add a new operator-facing guide `docs/guides/navi/configuring-the-menu.md`: file
  location/mount (`-m` / `--menu`, `NAVI_MENU`), `entries` shape, merge vs.
  `defaults: false`, per-entry `hidden`, ordering/repositioning, duplicate handling,
  the scrolling panel. Link it from the index list in
  `docs/guides/how_to_use_navi.md` beside `extending-navi.md`.
- Update `docs/agents/web-server.md` / `docs/agents/frontend.md` where they describe
  menu-file semantics (currently only the IMPL-1 subset).
- Leave `docs/agents/future/menu-configuration.md` in place (removed later by
  CLEAN-1 #807).

### Stock file (`docker`)

- Trim `source/config/menu.yml` and its Docker copy
  `dockerfiles/production_navi_hey/config/menu.yml` to a commented `entries:` example
  with no active entries -- with merge-with-defaults the explicit Logs/Memory rows
  are redundant, and `MenuConfig.DEFAULT_ENTRIES` (absent/empty fallback) now
  guarantees the defaults. Keep the file shipped so an operator has a concrete
  template to copy.

## Benefits

- Operators get the full documented way to extend the internal menu -- add, drop,
  relabel, reorder -- without forking Navi or rebuilding the image.
- Completes the `menu.yml` -> `/menu.json` -> `MenuMenu` pipeline started in IMPL-1
  against the settled SPEC-2 contract, with tests covering every rule.
- Keeps the menu-config surface minimal (three levers: append, `defaults: false`,
  per-entry `hidden`) and consistent with the `web.links` precedent, deferring
  richer UI rather than half-building it.

## Agents

engine, frontend, docs, docker.
