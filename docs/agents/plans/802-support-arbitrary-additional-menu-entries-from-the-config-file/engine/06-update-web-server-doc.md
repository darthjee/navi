# Update docs/agents/web-server.md

The "Menu configuration (`-m` / `--menu`)" section currently documents only the
IMPL-1 subset (file, `-m` flag, `NAVI_MENU`, `${VAR}`, missing-file fallback).
Extend it with the IMPL-2 semantics now that `MenuConfig` resolves them:

- Merge-with-defaults: operator `entries` append after Logs + Memory.
- `defaults: false` — drops both shipped defaults; the only way to an empty menu.
  Non-boolean → warn, treated as `true`.
- `entries: []` now keeps the defaults (note this reverses IMPL-1's documented
  "explicit empty list ⇒ empty menu").
- `hidden: true` — removes a matching default; on a non-default route it is a
  warned no-op.
- Repositioning a default by re-listing its `route` (text override / bare re-list
  keeps the label); no duplication.
- First-wins de-duplication by `route`, with a `Logger.warn` on later duplicates.
- Keep the fail-fast statement for unparseable YAML / non-list `entries`.

Update the inline example if helpful (e.g. show one added entry + a
`defaults: false` variant). Do **not** touch
`docs/agents/future/menu-configuration.md` (removed later by CLEAN-1 #807).

## Files to Change

- `docs/agents/web-server.md` — expand the menu-configuration section with the
  merge / `defaults` / `hidden` / reposition / de-dup rules.
