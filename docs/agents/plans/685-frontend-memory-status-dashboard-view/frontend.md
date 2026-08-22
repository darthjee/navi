# Frontend Plan: Frontend: memory status dashboard view

Main plan: [plan.md](plan.md)

## Steps

- [01 — Byte-formatting utility](frontend/01-byte-formatting-utility.md)
- [02 — Status-to-color constant](frontend/02-color-status-constant.md)
- [03 — MemoryStatusClient](frontend/03-memory-status-client.md)
- [04 — Controller and helper](frontend/04-controller-and-helper.md)
- [05 — MemoryStatus page component](frontend/05-page-component.md)
- [06 — Route and nav entry point](frontend/06-route-and-nav-entry.md)

## CI Checks

- `frontend`: `npm run lint` (CI job: `checks-frontend`)
- `frontend`: `npm test` (CI job: `jasmine-frontend`)

## Notes

- Blocked on the backend endpoint from #684 landing (`GET /memory/status.json`); this plan can be implemented against the agreed JSON contract in the issue in the meantime, but manual verification against a real server needs #684 merged.
- `percentage` is uncapped by contract (can exceed 100) — the "exceeds max" (purple) band depends on this; do not add defensive `Math.min(percentage, 100)` clamping anywhere in this plan's code.
- Follow the existing Controller/Helper/Client split convention (see `StatsHeader.jsx` + `StatsHeaderController.jsx` + `StatsHeaderHelper.jsx`, or the `LogsPage.jsx` trio) rather than inlining fetch/render logic directly in the page component.
