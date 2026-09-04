# Issue: Memory history: usage chart + MemoryStatus page integration

## Description

Part of #761 (temporal memory-usage graph on `/#/memory/status`).

The frontend data layer (#764, already merged) provides a `MemoryChartController`
that polls `/memory/history.json` and exposes an accumulated, capped array of
`{ id, value, percentage, timestamp }` points.

This sub-issue renders those points as a live line graph on `/#/memory/status`,
below the existing status card. The page already polls `/memory/status.json`
every 5s (`MemoryStatusController`), which provides `maximum` and `status`.

The frontend currently has NO charting library and no SVG/canvas anywhere — this
sub-issue introduces `recharts` as a deliberate, discussed exception (see #761).
The test env (jasmine + jsdom, no `canvas`) cannot lay out recharts, so the chart
component itself gets no render spec — it is verified by hand.

## Problem

`/#/memory/status` currently only shows an instantaneous snapshot (current /
maximum / percentage / status). There is no way to see how memory usage is
trending over time, so a slow leak or a spike that self-resolves between two
5s polls is invisible.

## Expected Behavior

- [ ] `recharts` added via Yarn; `frontend` builds (`yarn build`) and lints
      (`yarn lint`).
- [ ] `/#/memory/status` shows the existing status card **plus** a line graph of
      memory percentage over time, with per-threshold guide lines and an overflow
      indicator above 100%.
- [ ] The graph seeds from server history on page open (not blank until the first
      poll) and updates live as new samples arrive.
- [ ] `maximum` / `status` come from the page's existing `/memory/status.json`
      poll — no extra request.
- [ ] `MemoryStatus_spec` asserts the chart container mounts; no jsdom geometry
      assertions.

## Solution

- Add `recharts` to `frontend/package.json` with **Yarn** (`yarn add recharts` —
  the repo forbids `npm install`). Update the lockfile.
- `frontend/src/components/elements/MemoryUsageChart.jsx` +
  `frontend/src/components/elements/helpers/MemoryUsageChartHelper.jsx` — follow
  the component / helper split in `docs/agents/frontend.md` (component owns
  hooks + wires `MemoryChartController` via `useMemo` / `useEffect`, same
  pattern as `MemoryStatus.jsx` / `MemoryStatusController`; helper is pure
  render, no side effects).
  - `<LineChart>` with fixed pixel `width`/`height` — avoid `ResponsiveContainer`,
    which needs `getBoundingClientRect` that jsdom lacks; if responsiveness is
    wanted, accept it won't size under test.
  - X axis = timestamp, formatted with `date-fns` (already a dep).
  - Y axis = `percentage`, `domain={[0, 100]}`, `allowDataOverflow`.
  - One `<ReferenceLine>` per threshold (medium / high / over). `MemoryConfig`'s
    thresholds are backend-only and `/memory/status.json` doesn't return them —
    exposing them is a backend change, out of scope here. Hardcode the frontend
    defaults (`{ medium: 50, high: 75, over: 100 }`, mirroring
    `MemoryConfig`'s `DEFAULT_THRESHOLDS`) as a new constant next to
    `CLASS_BY_STATUS` in `frontend/src/constants/memoryStatus.js`. This can
    silently drift from a deployment's actual configured thresholds
    (`web.memory.thresholds`) — acceptable for v1; revisit if/when thresholds
    are exposed via the API.
  - `CLASS_BY_STATUS` in `memoryStatus.js` holds CSS class names, not colors —
    recharts needs real color values as props. Add a parallel
    `HEX_BY_STATUS` export (e.g. `{ low: '#495057', medium: '#198754',
    high: '#ffc107', over: '#dc3545' }`, plus the over-limit hex `#6f42c1`) next
    to `CLASS_BY_STATUS`, matching the values in `MemoryStatus.css`. This is the
    first hex-color-in-JS in this frontend; keep the two in sync by hand (no
    single source of truth today) and use `HEX_BY_STATUS` for `<ReferenceLine
    stroke>` and the overflow indicator.
  - An overflow indicator when the latest `percentage` > 100 (reuse
    `colorForMemoryStatus` for the CSS class, `HEX_BY_STATUS`'s over-limit hex
    for the chart stroke).
  - A `data-testid` on the container so the page spec can assert it mounts.
- Integrate into `frontend/src/components/pages/MemoryStatus.jsx` via
  `MemoryStatusHelper` — keep the existing status card, render
  `<MemoryUsageChart>` below it, and pass `maximum` (and `status`) down from the
  `/memory/status.json` poll the page already runs. Do not add a second
  `maximum` fetch.
- Specs:
  - Extend `frontend/spec/components/MemoryStatus_spec.js` to assert the chart
    container (`data-testid`) mounts alongside the status card — presence, not
    geometry.
  - At most a smoke test that `MemoryUsageChart` renders without throwing given
    N points. No assertions on rendered SVG geometry (jsdom can't lay out
    recharts).

### Out of scope

- The client / polling controller (separate sub-issue, #764 — already merged;
  this issue depends on it).
- Any backend change (including exposing configured thresholds via the API —
  see the hardcoded-defaults note above).
- A bytes view or percentage/bytes toggle (percentage only in v1).

## Benefits

- Completes the `/#/memory/status` picture (#761): operators can see memory
  trend, not just a point-in-time snapshot, making leaks and spikes visible at
  a glance.
- No new network requests — reuses the existing `/memory/status.json` poll for
  `maximum`/`status` and the already-built `MemoryChartController` for history.
