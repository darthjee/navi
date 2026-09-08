# Plan: SPEC: extensible operator-supplied menu entries

Issue: [796-spec-extensible-operator-supplied-menu-entries.md](../issues/796-spec-extensible-operator-supplied-menu-entries.md)

## Overview

This is a specification/documentation issue in the **menu track** of #794. The
deliverable is prose only: extend the SPEC-1 architecture document
`docs/agents/future/menu-configuration.md` with an "Operator-supplied entries"
section that pins down merge/replace, ordering, validation, collision, and
rendering-limit semantics so IMPL-2 (#802) can be implemented and tested without
re-deciding anything. No production code, no tests. The document is transient and
is removed by CLEAN-1 (#807) once the feature ships.

All design decisions are already settled on the issue (see its `## Solution`); this
plan is about capturing them precisely and consistently in the doc.

## Context

- **Menu track state**: SPEC-1 (#795) defines the dedicated menu configuration file
  — its format, configurable + Docker-volume-mountable load path, the
  `{ route, text }` entry shape, and Logs/Memory as defaults. SPEC-1's output is
  the file `docs/agents/future/menu-configuration.md`. This issue adds a section to
  that same file (or a clearly linked sibling if SPEC-1 chose a hub+subfolder
  layout like `docs/agents/future/crawler.md` + `crawler/`).
- **Existing precedent to reference** (do not re-specify — just point at it as the
  shape IMPL-2 will follow):
  - `source/lib/server/Router.js` — `GET_ROUTES` map; `'/links.json'` is wired as
    `new HandlerConfig(LinksHandler, [this.#webConfig.links])`.
  - `source/lib/server/handlers/LinksHandler.js` — merges configured entries with
    derived entries before serializing.
  - `source/lib/models/configs/Link.js` — `{ url, text }` model with
    `fromObject()` accepting a string or an object, `text` defaulting to `url`.
  - `source/lib/serializers/LinksSerializer.js` — `Serializer` subclass emitting
    plain `{ url, text }`.
  - `frontend/src/clients/LinksClient.js` → `frontend/src/components/elements/`
    `LinksMenu.jsx` → `LinksMenuHelper.jsx` → `LinksDropdown.jsx` →
    `LinksDropdownItem.jsx`: the current menu is a single `Links` dropdown button
    rendering a flat `<ul>` of `<a>` items. This is the "flat dropdown" the
    rendering-limits subsection reasons about.
  - `frontend/src/components/elements/StatsDisplay.jsx` — the hard-coded
    `<StatItem label="Logs" to="/logs" />` / `<StatItem label="Memory"
    to="/memory/status" />` cards that IMPL-1 (#801) removes.
- **Fail-fast precedent**: `source/lib/services/config/ConfigLoader.js` /
  `ConfigIncluder.js` throw typed errors (`MissingTopLevelConfigKey`,
  `ConfigurationFileNotFound`, `ConfigurationIncludeNotFound`) — Navi aborts
  startup on bad top-level config. The issue deliberately diverges from this for an
  individual malformed menu entry.
- **Warn precedent**: `source/lib/utils/logging/Logger.js` (`Logger.warn`), already
  used for skip-and-continue cases in
  `source/lib/parsers/css_selector_parser/FilterMatcher.js` and
  `source/lib/utils/HtmlElementParser.js`. The "skip-and-warn" recommendation
  should name `Logger.warn` as the mechanism.

## Settled decisions to document (from the issue)

1. **Merge with defaults + opt-out.** Custom entries append to Logs/Memory. A
   top-level `defaults: false` drops both defaults; a per-entry `hidden: true`
   matched on a default's `route` removes just that one. Zero-config behaviour
   unchanged.
2. **File order controls render order.** Defaults first, custom entries after,
   unless the operator re-lists a default `route` to reposition it. No `order` key
   in v1.
3. **Skip-and-warn for a malformed individual entry** (`Logger.warn`, drop the
   entry, keep the menu working). A structurally unparseable *file* follows
   SPEC-1's file-level policy.
4. **Duplicate `route`: first wins**, later duplicates skipped with a warning.
5. **No hard entry cap**; the dropdown scrolls. Grouping, nesting, and icons are
   out of scope — recorded as future work.

## Implementation Steps

### Step 1 — Write the "Operator-supplied entries" section

Add a section to `docs/agents/future/menu-configuration.md` covering the six points
from the issue's `## Expected Behavior`, each landing on the matching settled
decision above:

- **Adding entries** — show the concrete before/after of the mounted file: the
  default file, then the same file with two custom entries appended. State the
  merge-with-defaults rule, the top-level `defaults: false` opt-out, and the
  per-entry `hidden: true` (matched by `route`) for removing a single default.
  Include a small YAML example for each.
- **Ordering** — file order; defaults precede custom entries; re-listing a default
  `route` repositions it (and does not duplicate it — cross-reference the
  duplicate rule). Explicitly state there is no `order` key in v1 and why
  (keep the surface minimal).
- **Validation** — list required fields per entry (`route`, `text` — reconcile
  exact names/optionality with SPEC-1), `route` string constraints (leading `/`,
  no whitespace; match whatever SPEC-1 says about internal vs external), and the
  malformed-entry policy: `Logger.warn` + skip the entry, contrasted explicitly
  with `ConfigLoader`'s fail-fast for the file as a whole. Give an example warning
  message string.
- **Collision with defaults** — a custom entry whose `route` equals `/logs` or
  `/memory/status`: treated as a reposition/override of that default (last
  definition wins for its `text`, position follows the custom entry's file
  position). A custom entry that merely reuses the *text* "Logs"/"Memory" on a
  different route is allowed (warn is optional — recommend no warn). Tie this back
  to the duplicate-`route` rule so the two are consistent.
- **Rendering limits** — describe current `LinksDropdown` behaviour (flat `<ul>`
  in a Bootstrap dropdown). State: no cap; long lists scroll (note the dropdown
  needs `max-height` + `overflow-y:auto` — flag as an IMPL-2 UI detail, not a
  config concern). Record grouping / submenus / icons as out of scope and point to
  a future `docs/agents/future/` note rather than half-specifying them here.
- **Interaction with the extension track** — a custom entry may target a route
  added by IMPL-3/IMPL-4 (#803/#804). Document the ordering dependency ("the route
  must be registered before the menu entry resolves to anything") but state clearly
  that the menu config contract and the extra-routes config contract are separate
  files/schemas and neither validates against the other. A menu entry pointing at
  a not-yet-registered route renders as a normal link that 404s / shows the SPA
  fallback — it is not a config error.

Keep every subsection to a concrete recommendation, not an options list (issue
acceptance criterion).

### Step 2 — Cross-link and reconcile

- Add forward references in the new section to IMPL-2 (#802) as the implementation
  issue, and back-references to SPEC-1 (#795) for the base file format.
- If `menu-configuration.md` has an intro/table-of-contents (SPEC-1's choice),
  add the new section to it.
- Reconcile terminology with whatever SPEC-1 actually wrote: entry field names
  (`route`/`text`), the config key/filename, and the "internal vs external route"
  decision. If SPEC-1 is not yet merged when this is worked, write the section
  against the SPEC-1 description in #794/#795 and add a `> Depends on #795` note at
  the top of the section so a later pass can align exact names.
- Verify the issue's acceptance criteria are all satisfied by the finished
  section: add/order/validate/collision/limits covered; concrete recommendation
  for merge-vs-replace and malformed-entry handling; enough for IMPL-2 to proceed.

## Files to Change

- `docs/agents/future/menu-configuration.md` — add the "Operator-supplied entries"
  section (all six subsections) and wire it into the doc's intro/TOC. Created by
  SPEC-1 (#795); if that file does not yet exist when this issue is worked, create
  it with a minimal SPEC-1-aligned skeleton plus this section, and note the
  dependency at the top.

## Notes

- Pure documentation change under `docs/agents/future/`. No code, no specs, no
  build. No CI job covers `docs/**` (CI is per-code-folder lint + jasmine only),
  so there are no CI checks for this issue.
- Ordering dependency: this issue extends SPEC-1's (#795) output file. Ideally
  #795 lands first. The plan's Step 2 handles the "SPEC-1 not yet merged" case so
  this is not a hard block.
- The document is throwaway: CLEAN-1 (#807) deletes it and folds anything lasting
  into `docs/agents/frontend.md` / `docs/agents/web-server.md` / a user guide.
  Keep the section self-contained so that later extraction is mechanical.
- Do not expand scope: no `order` key, no icons, no grouping, no external-URL
  semantics (that last one is SPEC-1's call). If discussion during authoring
  surfaces a genuine new concern, raise it as a comment on #794 rather than
  widening this doc.
