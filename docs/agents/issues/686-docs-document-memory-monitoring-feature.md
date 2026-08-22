# Issue: Docs: document memory monitoring feature

## Description

Document the memory monitoring feature (parent #682) now that both of its dependencies have merged:

- Backend: `GET /memory/status.json` endpoint + `web.memory` config (#684, merged via PR #689).
- Frontend: `/#/memory/status` dashboard view (#685, merged via PR #690).

This is a documentation-only issue — no source changes.

## Solution

### `README.md`

- Add `web.memory` to the Configuration File example (`### Structure`) and its `### Fields` table:
  - `web.memory.maximum` — optional configured memory ceiling, in bytes. When omitted, it's resolved via a fallback chain: configured value → cgroup v2 limit → cgroup v1 limit → OS total memory.
  - `web.memory.thresholds.low` / `.medium` / `.high` / `.over` — percentage-of-maximum boundaries used to derive the reported `status`. Default `{low: 25, medium: 50, high: 75, over: 100}`; must be strictly ascending or the config is rejected.
- Document `GET /memory/status.json`: unauthenticated (same as the other `GET` monitoring endpoints — no `web.api.token` involved), responds with `{ current, maximum, percentage, status }`, where `current`/`maximum` are byte counts and `status` is one of `low`/`medium`/`high`/`over`.
- Add a "Memory status (`/#/memory/status`)" entry alongside the existing Dashboard/Jobs list/Job detail screens under `### Web UI`: shows current vs. maximum memory usage (formatted, e.g. `512 MB / 2 GB`), the usage percentage, and a color-coded status label.

### `DOCKERHUB_DESCRIPTION.md`

- Mention the memory monitoring feature, matching this file's existing compact style: a `Memory status` row in the Screens table (`/#/memory/status`) and a `web.memory` row in the Fields table.

### Rename

- `docs/guides/HOW_TO_USE_NAVI.md` → `docs/guides/how_to_use_navi.md`.
- Update every internal reference to the old filename repo-wide, including (not exhaustive): `README.md`, `DOCKERHUB_DESCRIPTION.md`, `source/README.md`, `docs/guides/navi/*.md`, `docs/guides/navi-client/reference.md`, and the agent-roster references in `.claude/agents/architect.md` and `.claude/agents/docs.md`.

### Agent ownership

- `docs` — `README.md`, `DOCKERHUB_DESCRIPTION.md`, the file rename itself, and updating references in every guide/README it owns.
- `architect` — updates the two agent-roster references in `.claude/agents/architect.md` and `.claude/agents/docs.md` (outside `docs`'s own scope).

### Out of scope

- No code changes — this is a documentation-only sub-issue.
- Creating any file at `docs/agents/frontend.md`: that path already exists as the `frontend` specialist agent's own definition file (used by this project's agent-dispatch tooling) and must not be overwritten. The parent issue's original ask to create a "frontend interface plan" there was dropped during splitting for this reason.

## Benefits

- Keeps `README.md`/`DOCKERHUB_DESCRIPTION.md` accurate now that the memory monitoring feature has shipped, so operators know how to enable and interpret it.
- Removes the `HOW_TO_USE_NAVI.md` naming inconsistency — every other guide file under `docs/guides/` already uses lowercase-with-underscores.
