# Docs Plan: Memory history: document data_store config + /memory/history.json

Main plan: [plan.md](plan.md)

## Shared contracts

- `web.memory.maximum`, `web.memory.thresholds` (defaults `25.0`/`50.0`/`75.0`/`100.0`),
  `web.memory.data_store.size` (default `100`), `.interval` (default `5`), `.page_size`
  (default `20`) — must match the values `engine.md` states for the same keys.
- Retained window ≈ `size × interval` seconds (~8 min at defaults) — same wording basis as `engine.md`.
- Do not restate the `GET /memory/history.json` JSON shape here — that detail lives only in
  `docs/agents/web-server.md` (see `engine.md`), consistent with this guide already omitting raw
  JSON shapes for every other monitoring endpoint (`/jobs.json`, `/stats.json`, etc.).

## Implementation Steps

### Step 1 — Add a "Memory status" screen row and a `web.memory` blurb

In `docs/guides/navi/reference.md`, under "### Headless vs. web UI mode":

- Add a row to the screens table (alongside Dashboard / Jobs list / Job detail):
  `| Memory status | /#/memory/status | Real-time RSS usage against the configured maximum, plus a historical usage graph. |`
- Add a short paragraph (or small sub-list) after the screens table introducing `web.memory`:
  - `maximum` — optional, bytes; falls back to cgroup v2 → cgroup v1 → OS total memory when unset.
  - `thresholds` — optional; `low`/`medium`/`high`/`over` percentage bands, defaults
    `25.0`/`50.0`/`75.0`/`100.0`.
  - `data_store` — `size` (default `100`), `interval` (default `5`), `page_size` (default `20`);
    note the retained window is roughly `size × interval` seconds (~8 min at defaults) and that
    the buffer is in-memory only (lost on restart, same as job/log/emission data).
  - Link to `docs/agents/web-server.md` for the full HTTP API reference (config validation
    rules, exact endpoint shapes) rather than repeating it here.

## Files to Change

- `docs/guides/navi/reference.md` — add the "Memory status" screen row and the `web.memory`
  config blurb under "Headless vs. web UI mode".

## Notes

- Purely a documentation change — no CircleCI job applies (no markdown-lint job in
  `.circleci/config.yml`; the `checks*`/`jasmine*` jobs run JS lint/tests).
