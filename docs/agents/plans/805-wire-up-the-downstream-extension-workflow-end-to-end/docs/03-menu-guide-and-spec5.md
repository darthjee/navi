# `configuring-the-menu.md` + SPEC-5 §6a menu path

Two more places carry the `/navi/menu.yml` assumption.

## What to do

- `docs/guides/navi/configuring-the-menu.md` — find every `NAVI_MENU` /
  `/navi/menu.yml` mention (including the "Pointing at an extension route"
  section) and align to `./config/menu.yml` → `/home/node/app/config/menu.yml`,
  consistent with `extending-navi.md` after step 01. Confirm the documented CLI
  default (`-m` / `--menu` default `config/menu.yml`) matches
  `source/lib/services/application/ArgumentsParser.js` — it does; keep it.
- `docs/agents/future/downstream-extension-workflow.md` (SPEC-5) — §6a and its
  table row currently state `/navi/menu.yml`. Update to `./config/menu.yml` and
  the `/home/node/app/config/menu.yml` mount/COPY target, with a one-line note
  that the production image already ships this default. (The file is deleted by
  CLEAN-1 / #807, but keep it correct meanwhile.)

## Files to Change

- `docs/guides/navi/configuring-the-menu.md` — menu-path mentions.
- `docs/agents/future/downstream-extension-workflow.md` — §6a + the contract
  table row for the menu file.
