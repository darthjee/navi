# Frontend Plan: Navi: expose Job#endedAt in job serializers

Main plan: [plan.md](plan.md)

## Shared contracts

The frontend **can rely on** every job object from `GET /jobs/:status.json` and `GET /job/:id.json` carrying `endedAt: string | null`: an ISO 8601 string when the job has ended (finished/dead), `null` otherwise. Render it with `frontend/src/utils/formatTimestamp.js`, which already returns `—` for `null`.

## Steps

- [01 — "Ended at" row on the job detail page](frontend/01-detail-row.md)
- [02 — "Ended at" column in the jobs table](frontend/02-table-column.md)
- [03 — Specs and rebuild](frontend/03-specs-and-build.md)

## CI Checks

- `frontend`: `cd frontend && npm test && npm run lint` (CI jobs: `jasmine-frontend`, `checks-frontend`)

## Notes

- Times are shown in the browser's local time via `formatTimestamp`, consistent with the logs/extractions pages. No UTC label is added.
- Do not touch `clients/node`, since it has no job endpoints.
