# Build MemoryUsageChart component + helper

Create the chart component, following the component/helper split already used
by `MemoryStatus.jsx` / `MemoryStatusHelper.jsx` and documented in
`docs/agents/frontend.md`: the component owns hooks and wires the controller,
the helper is pure render with no side effects.

`MemoryUsageChart.jsx`:
- Accepts the points array (`{ id, value, percentage, timestamp }[]`) plus
  `maximum` and `status`, passed down by the page (see step 04) — it does not
  fetch anything itself.
- Wires `MemoryChartController` (already built in #764,
  `frontend/src/components/elements/controllers/MemoryChartController.jsx`)
  via `useMemo` / `useEffect`, the same pattern
  `MemoryStatus.jsx` uses for `MemoryStatusController`.
- Delegates rendering to `MemoryUsageChartHelper`.

`MemoryUsageChartHelper.jsx`:
- `<LineChart>` with a **fixed pixel** `width`/`height` — do not use
  `ResponsiveContainer`, which needs `getBoundingClientRect` (unavailable in
  jsdom); note in a comment that responsiveness is intentionally deferred.
- X axis: `timestamp`, formatted with `date-fns` (already a dependency).
- Y axis: `percentage`, `domain={[0, 100]}`, `allowDataOverflow`.
- One `<ReferenceLine>` per threshold (`medium`/`high`/`over`), using
  `DEFAULT_MEMORY_THRESHOLDS` and `HEX_BY_STATUS`/`OVER_LIMIT_HEX` from step
  02's `frontend/src/constants/memoryStatus.js`.
- An overflow indicator when the latest point's `percentage` > 100 — reuse
  `colorForMemoryStatus` for any CSS-class-based styling and `OVER_LIMIT_HEX`
  for anything rendered by `recharts` itself.
- A `data-testid` (e.g. `memory-usage-chart`) on the chart's outer container
  so the page spec (step 05) can assert it mounts, without asserting on SVG
  geometry.

## Files to Change

- `frontend/src/components/elements/MemoryUsageChart.jsx` — new component.
- `frontend/src/components/elements/helpers/MemoryUsageChartHelper.jsx` — new
  helper.
