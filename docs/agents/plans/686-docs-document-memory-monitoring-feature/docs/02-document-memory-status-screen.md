# Document the Memory status screen in README.md and DOCKERHUB_DESCRIPTION.md

Add the new `/#/memory/status` dashboard screen alongside the existing screens, in both files, matching each file's existing style.

## `README.md`

Under `### Web UI` (in `## Roadmap`), add a new screen entry after **Job detail (`/#/job/:id`)**, following the same `**Name (`/#/path`)**` heading style used by the other screens:

**Memory status (`/#/memory/status`)** — shows current process memory usage against the resolved maximum, color-coded by status:

- Current vs. maximum usage, formatted (e.g. `512 MB / 2 GB`).
- Usage percentage.
- Status label (`low`/`medium`/`high`/`over`), colored per status — a distinct color when usage exceeds 100% of the maximum.

## `DOCKERHUB_DESCRIPTION.md`

This file already has a compact `Screens` table (`| Screen | URL | Description |`, currently listing Dashboard/Jobs list/Job detail) and its own `### Fields` table. Match that style:

- Add a row to the Screens table: `| Memory status | \`/#/memory/status\` | Current process memory usage vs. the resolved maximum, with a color-coded status. |`
- Add a `web.memory` row to the Fields table (short form, mirroring how `web.port` is described there): configured memory ceiling and status thresholds used by the memory monitoring endpoint/screen.

## Files to Change

- `README.md` — add the "Memory status" screen entry under `### Web UI`.
- `DOCKERHUB_DESCRIPTION.md` — add a `Memory status` row to the Screens table and a `web.memory` row to the Fields table.
