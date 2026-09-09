# README + DOCKERHUB env-var rows

`README.md` (~line 71) and `DOCKERHUB_DESCRIPTION.md` (~line 42) both carry an
identical 11-row env-var override table and no mention of the extension / menu
surface.

## What to do

In **both** files:

- Add three rows. They are loader/CLI controls, not "packed config" fields, so
  either put them under a short sub-heading ("Extension & menu controls") or add
  a clause to the intro sentence ("...and a few loader/CLI controls below"):

  | Env var | Default | Meaning |
  |---|---|---|
  | `NAVI_EXTENSIONS_ENABLED` | unset (off) | Load extra backend routes + frontend pages from the extensions mount. Truthy = `1`/`true`/`yes`/`on`. |
  | `NAVI_EXTENSIONS_DIR` | `/navi/extensions` | Mount point scanned for `backend/` and `frontend/` subtrees. |
  | `NAVI_MENU` | `./config/menu.yml` | Menu config file (`-m` / `--menu`). |

- Add a one-paragraph "Extending Navi" pointer after the table linking
  `docs/guides/navi/extending-navi.md` (add your own routes/pages) and
  `docs/guides/navi/configuring-the-menu.md` (customise the nav menu).
- Keep `README.md` and `DOCKERHUB_DESCRIPTION.md` wording in sync (they already
  mirror each other; `DOCKERHUB_DESCRIPTION.md`'s `NAVI_CONFIG` row is the
  shorter variant — match that style there).

## Files to Change

- `README.md` — three env rows + "Extending Navi" pointer.
- `DOCKERHUB_DESCRIPTION.md` — same.

## Notes

- Do not restate the full extension contract here — a pointer only; the guide is
  the reference.
