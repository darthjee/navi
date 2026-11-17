# Specs and rebuild

**Specs:**

- `JobRow_spec.js` / `JobsTable_spec.js`: the "Ended at" header is present. The cell shows the formatted timestamp when `endedAt` is set and `—` when it is `null`.
- `Job_spec.js` / `Job_status_spec.js`: the detail page shows "Ended at" for a finished/dead job and omits the row when `endedAt` is `null`.
- A new `EndedAtRow` spec, if component specs are kept per element.
- Update existing job fixtures (e.g. `Jobs_spec.js`) to include `endedAt`, so they match the API contract.

**Rebuild:** after the changes, rebuild the frontend and copy it into `source/static/`, following the repo's contributing guide, so the main app serves the new UI.

## Files to Change

- `frontend/spec/components/JobRow_spec.js` — `endedAt` set and `null` cases.
- `frontend/spec/components/JobsTable_spec.js` — header and cell.
- `frontend/spec/components/Job_spec.js` — detail "Ended at" row.
- `frontend/spec/components/Job_status_spec.js` — per-status presence.
- `frontend/spec/components/Jobs_spec.js` — fixtures include `endedAt`.
- `frontend/spec/components/EndedAtRow_spec.js` (new, optional) — component spec.
- `source/static/` — rebuilt frontend assets.
