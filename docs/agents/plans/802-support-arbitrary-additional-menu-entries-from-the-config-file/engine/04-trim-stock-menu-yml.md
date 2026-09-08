# Trim the packaged stock menu.yml

`source/config/menu.yml` currently lists Logs + Memory explicitly. With
merge-with-defaults those rows are redundant (they now reposition the defaults to
the same place), and `MenuConfig.DEFAULT_ENTRIES` already guarantees the defaults
when the file has no active entries.

- Replace the file body with a **commented-out** example an operator copies and
  edits — no active `entries` key. Cover the common levers in the comments:
  a plain added entry, an external URL, `defaults: false`, and `hidden: true` on
  a default.
- Keep the file present (it is published via `source/package.json`
  `files: ["config", …]`).
- Use the **exact same content** as the Docker copy the `docker` agent writes to
  `dockerfiles/production_navi_hey/config/menu.yml` — the two stock files must not
  drift.
- Verify with `MenuConfig.fromFile` behaviour: a fully-commented file is
  whitespace/`null` after parse → `DEFAULT_ENTRIES` → menu still shows Logs +
  Memory.

## Files to Change

- `source/config/menu.yml` — replace the two active entries with a commented
  template; no behavioural entries.
