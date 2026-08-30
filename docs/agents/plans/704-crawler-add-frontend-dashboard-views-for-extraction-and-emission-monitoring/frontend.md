# Frontend Plan: Crawler: add frontend dashboard views for extraction and emission monitoring

Main plan: [plan.md](plan.md)

## Shared contracts

This agent **consumes** the engine contracts in [plan.md](plan.md#shared-contracts):

- `GET /emissions.json` → `{ counts: { extracted, emitted, failed, dead }, emissions: [{ id, extractionId, status, url, method, httpStatus, error, itemRef, timestamp }] }`, oldest-first, `?last_id=` cursor. `status` ∈ `success` | `failed` | `dead`.
- `GET /extractions.json` → `{ counts: { extracted }, extractions: [{ id, parserType, originUrl, itemCount, timestamp }] }`, oldest-first, `?last_id=` cursor. `originUrl` may be `null`.
- `GET /stats.json` → already includes `emissions: { extracted, emitted, failed, dead }`; the frontend currently discards it in `StatsClient.normalizeStats`.

Join key for the `/extractions` view: `emission.extractionId === extraction.id`. Best-effort — the emission buffer is retention-bounded, so older extractions may have partial/no emit data; render gracefully and label it.

## Steps

- [01 — Add ExtractionsClient and EmissionsClient](frontend/01-add-clients.md)
- [02 — Surface emission counts in StatsHeader](frontend/02-emissions-in-statsheader.md)
- [03 — Add the /emissions page view](frontend/03-emissions-page.md)
- [04 — Add the /extractions page view](frontend/04-extractions-page.md)
- [05 — Tests, docs and build check](frontend/05-tests-and-build.md)

## CI Checks

- `frontend`: `yarn test` (CI job: `jasmine-frontend`)
- `frontend`: `yarn lint` (CI job: `checks-frontend`)

## Notes

- Follow the three-file convention: `pages/<Name>.jsx` + `pages/controllers/<Name>Controller.jsx` + `pages/helpers/<Name>Helper.jsx`, optional co-located `<Name>.css`. `MemoryStatus` is the template for interval-refresh; `LogsPage` + `elements/Logs.jsx` + `elements/controllers/LogsController.jsx` (or `pages/controllers/LogsPageController.jsx`) is the template for `last_id` cursor polling.
- Raw Bootstrap classNames (`card`, `table table-striped`, `badge text-bg-*`, `d-flex gap-2`, `vr`), not `react-bootstrap` imports. No charting library is available — tables and badges only.
- Reuse `elements/StatItem.jsx` (a badge that is also a router `Link` when given `to`), `elements/JobStatusBadge.jsx` styling conventions, `ErrorAlert.jsx`, `LoadingSpinner.jsx`.
- `frontend/dist/` and `source/static/` are not committed. `yarn build` is a smoke check only — do not copy or commit build output.
- Both views and the header must render cleanly with zero counts / empty feeds, and recover when the engine resets the stores mid-session.
