# `frontend/src/`

Source for the React SPA monitoring dashboard. Immediate children:

- `main.jsx` — React entrypoint; `HashRouter` setup and the route table.
- `clients/` — pure `fetch` API client modules, one per backend endpoint
  (`StatsClient`, `JobsClient`, `JobClient`, `EngineClient`, `LinksClient`,
  `LogsClient`, `MemoryStatusClient`, `MemoryHistoryClient`, `EmissionsClient`,
  `ExtractionsClient`).
- `components/` — React components: `pages/` (route-level) and `elements/`
  (reusable widgets); each non-trivial one splits into `<Name>.jsx` +
  `controllers/` + `helpers/`.
- `constants/` — shared constant maps (`jobClasses.js` job-class filter options,
  `jobStatus.js` status → Bootstrap colour variant, `memoryStatus.js`).
- `utils/` — pure helpers: `FilterParams`, `formatBytes`, `formatPercentage`,
  `formatTimestamp`, `noop`.

## See also

[`docs/agents/frontend.md`](../../docs/agents/frontend.md) — the full frontend reference: stack, routing, component conventions, build.
