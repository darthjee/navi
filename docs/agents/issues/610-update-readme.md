# Issue: Update README

## Description
Several recent features shipped without corresponding updates to the top-level `README.md`:

- Resource enable/disable (`disabled: true` / `enabled: false` on a resource-request entry) — commit e528425.
- `web.idle_timeout` auto-shutdown — commit 08708f4.
- Config splitting across files via `include` and `namespace` — commit 9963325.

All three are already documented in `docs/HOW_TO_USE_NAVI.md` and/or `docs/agents/`, but `README.md` — the first thing a visitor sees — was not updated.

## Problem
A reader who only looks at `README.md`'s Configuration File section (the YAML example and the Fields table) has no way to discover that resources can be disabled or that `web.idle_timeout` exists, and has no pointer to the config-splitting feature described in `HOW_TO_USE_NAVI.md`. The README's feature list and Fields table are out of sync with what Navi actually supports.

## Expected Behavior
`README.md` reflects the current feature set: the Fields table includes the new `disabled`/`enabled` resource-request field and the `web.idle_timeout` field, and the Key Features list / a short section mentions config splitting (with a pointer to `HOW_TO_USE_NAVI.md` for full `include`/`namespace` details).

## Solution
- Add `web.idle_timeout` to the YAML example and the Fields table (Configuration File section), matching the description already in `docs/agents/web-server.md`.
- Add a `disabled`/`enabled` row to the Fields table for resource-request entries, matching `docs/agents/flow/startup-and-config.md`.
- Add a bullet to the top-level Key Features list mentioning config splitting via `include`/`namespace`, linking to `docs/HOW_TO_USE_NAVI.md` for details.
- Leave the deep-dive explanations (full `include`/`namespace` semantics, cross-namespace references) in `docs/HOW_TO_USE_NAVI.md` — README should stay a high-level entry point, consistent with its existing structure.

## Benefits
Keeps the README trustworthy as the entry point for new users and contributors, avoiding confusion about what configuration options actually exist.
