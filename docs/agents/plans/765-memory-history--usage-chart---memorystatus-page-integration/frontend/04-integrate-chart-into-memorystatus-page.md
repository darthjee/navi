# Integrate chart into MemoryStatus page

Wire `MemoryUsageChart` into the existing page without adding any new fetch.

- `MemoryStatus.jsx` already polls `/memory/status.json` every 5s via
  `MemoryStatusController` and holds `status` (`{ current, maximum,
  percentage, status }`) in state. Pass `status.maximum` and `status.status`
  through to `MemoryStatusHelper.render`, which now also renders
  `<MemoryUsageChart>` below the existing status card.
- `MemoryUsageChart` itself is responsible for fetching history via
  `MemoryChartController` (step 03) — do not add a second `maximum` or status
  fetch anywhere in this step.
- Add any new CSS needed for the chart/overflow-indicator layout to
  `MemoryStatus.css`, alongside the existing `.text-memory-*` rules.

## Files to Change

- `frontend/src/components/pages/MemoryStatus.jsx` — no fetch changes; ensure
  `maximum`/`status` flow down.
- `frontend/src/components/pages/helpers/MemoryStatusHelper.jsx` — render
  `<MemoryUsageChart>` below the status card.
- `frontend/src/components/pages/MemoryStatus.css` — add layout/spacing rules
  for the chart if needed.
