# Issue: SPEC: extensible operator-supplied menu entries

## Description

Spec issue — part of #794, **menu track**. Produces / extends an architecture
document under `docs/agents/future/`; no production code. Removed by CLEAN-1 (#807)
once the feature ships.

SPEC-1 (#795) defines the dedicated menu configuration file: its format, load path
(configurable, Docker-volume mountable), the `{ route, text }` entry shape, and the
Logs/Memory defaults. This issue layers the **operator-facing semantics** on top of
that format: how an operator grows the menu with additional entries, and how Navi
resolves ordering, validation, and collisions when they do.

Scope boundary with SPEC-1: SPEC-1 owns the file (where it lives, how it is parsed,
what one entry looks like). This issue owns what happens when the file contains more
than the defaults. Where the two overlap, SPEC-1's decisions win and this doc
references them.

## Problem

Even once the menu is config-driven (SPEC-1 / IMPL-1 #801), the behaviour when an
operator actually adds entries is undefined:

- Does supplying a menu file replace the Logs/Memory defaults or append to them?
- In what order do entries render, and where do custom entries sit relative to the
  defaults?
- What makes an entry invalid, and does a bad entry warn-and-skip or abort startup?
- What happens on a duplicate `route`, or a custom entry that reuses `/logs` or
  `/memory/status`?
- Is there an upper bound on entry count, and how does the menu render with many?

IMPL-2 (#802) cannot be planned until these are pinned down.

## Expected Behavior

Deliverable: `docs/agents/future/menu-configuration.md` (the SPEC-1 doc) extended
with an "Operator-supplied entries" section — or a sibling doc under
`docs/agents/future/` — covering:

- **Adding entries** — the exact edit an operator makes to the mounted file;
  merge-with-defaults vs. full-replace semantics; whether/how a default entry can
  be hidden or repositioned.
- **Ordering** — how order is determined (file order vs. an explicit `order` key),
  and the position of custom entries relative to Logs/Memory.
- **Validation** — required fields, `route` string constraints, duplicate-`route`
  handling, and the malformed-entry policy (skip-and-warn vs. fail-fast), stated
  relative to Navi's existing fail-fast config loading (`ConfigLoader` throws
  typed errors such as `MissingTopLevelConfigKey` today).
- **Collision with defaults** — behaviour when a custom entry reuses a default
  `route` or the "Logs"/"Memory" text.
- **Rendering limits** — behaviour of the current dropdown menu (`LinksMenu` →
  `LinksDropdown`, a flat `<ul>` of items) with many entries: scroll, wrap, and
  whether grouping/nesting/icons are in scope or explicitly deferred.
- **Interaction with the extension track** — a custom entry may target a route
  added by IMPL-3/IMPL-4 (#803/#804); note the "route must exist before the menu
  entry is useful" ordering dependency, but keep the two config contracts separate.

Each item must land on a **concrete recommendation**, not a list of options.

## Solution

Decisions to bake into the doc (settled in discussion on this issue):

- **Merge with defaults**, with an explicit opt-out: a top-level `defaults: false`
  drops Logs/Memory entirely, and an individual entry may carry `hidden: true`
  against a known default `route` to remove just that one. Rationale: unchanged
  out-of-the-box behaviour; operators add entries without re-declaring the defaults.
- **File order** determines render order. Defaults render first, custom entries
  after, unless the operator re-lists a default `route` to reposition it. No
  separate `order` key in v1.
- **Skip-and-warn** for a malformed *individual* entry (log a warning, drop that
  entry, keep the menu working) — the menu is cosmetic and must never take the
  server down. A structurally unparseable *file* follows SPEC-1's file-level policy.
- **Duplicate `route`**: first entry wins; later duplicates skipped with a warning.
- **No hard entry cap**; the dropdown scrolls. Grouping, nesting, and icons are out
  of scope, recorded as future work.

## Benefits

- IMPL-2 (#802) has an unambiguous contract to implement and test against.
- Operators get a predictable, documented way to extend the menu without forking
  Navi or rebuilding the image.
- Keeps the menu-config surface minimal and consistent with the existing
  `web.links` precedent, deferring richer UI (groups, icons) rather than
  half-specifying it now.
