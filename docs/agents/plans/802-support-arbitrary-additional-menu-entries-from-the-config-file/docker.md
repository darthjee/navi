# docker Plan: Support arbitrary additional menu entries from the config file

Main plan: [plan.md](plan.md)

## Shared contracts

- `dockerfiles/production_navi_hey/config/menu.yml` is copied into the image at
  `/home/node/app/config/menu.yml` and used via `ENV NAVI_MENU=./config/menu.yml`
  / `CMD navi-hey -c $NAVI_CONFIG -m $NAVI_MENU`. None of that wiring changes.
- The file content must stay **identical** to the npm-package stock file
  `source/config/menu.yml` that the `engine` agent trims — the two stock
  templates must not drift.
- `MenuConfig.DEFAULT_ENTRIES` supplies Logs + Memory whenever the file has no
  active entries, so trimming the file to comments does not change the running
  menu.

## Implementation Steps

### Step 1 — Trim the image's stock menu.yml

Replace the two active Logs/Memory entries in
`dockerfiles/production_navi_hey/config/menu.yml` with the same commented-out
example template used for `source/config/menu.yml` (a plain added entry, an
external URL, `defaults: false`, and `hidden: true` on a default — all
commented). Leave the `Dockerfile` (`ENV NAVI_MENU`, `COPY`, `CMD`) untouched.

## Files to Change

- `dockerfiles/production_navi_hey/config/menu.yml` — replace active entries with
  the commented template (identical to `source/config/menu.yml`).

## Notes

- Coordinate the exact comment text with the `engine` agent's step 04 so the two
  files match byte-for-byte.
