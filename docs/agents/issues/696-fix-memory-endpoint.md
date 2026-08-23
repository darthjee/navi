# Issue: Fix memory endpoint

## Description
The memory status page (`/#/memory/status`) displays real-time memory usage — current usage, maximum limit, and percentage — fetched via `MemoryStatusClient` every 5 seconds. The page follows the project's three-file convention (`MemoryStatus.jsx` / `helpers/MemoryStatusHelper.jsx` / `controllers/MemoryStatusController.jsx`).

## Problem
The percentage value returned by the backend (`GET /memory/status.json`, `percentage = current / maximum * 100`) is rendered in `MemoryStatusHelper.jsx` with no formatting at all:

```jsx
{formatBytes(current)} / {formatBytes(maximum)} ({percentage}%)
```

This shows the raw floating-point value with excessive precision, e.g.:

`83.6 MB / 512.0 MB (16.326141357421875%)`

`formatBytes` already truncates the byte values correctly (via `toFixed(1)`, see `frontend/src/utils/formatBytes.js`), but no equivalent treatment exists for the percentage.

## Expected Behavior
The percentage should be truncated to 1 decimal place using standard "round half up" rounding, matching the existing byte formatting:

`83.6 MB / 512.0 MB (16.3%)`

| Value | Rounded |
| --- | --- |
| 0.11 | 0.1 |
| 0.14 | 0.1 |
| 0.15 | 0.2 |
| 0.19 | 0.2 |

Plain `toFixed(1)` alone is not reliable for round-half-up across all inputs (known floating-point edge cases); the implementation must round explicitly before formatting.

## Solution
Add a new `frontend/src/utils/formatPercentage.js` utility, following the same pattern as `formatBytes.js`, and use it in `MemoryStatusHelper.jsx` in place of the raw `{percentage}`:

```js
const formatPercentage = (value) => {
  return `${(Math.round(value * 10) / 10).toFixed(1)}`;
};

export default formatPercentage;
```

`Math.round(value * 10) / 10` performs the round-half-up rounding, and the trailing `.toFixed(1)` guarantees exactly one decimal place is always shown (e.g. `16.0` rather than `16`).

This is a frontend-only change — the backend endpoint (`/memory/status.json`) keeps returning full floating-point precision, since other consumers (e.g. threshold/color logic in `frontend/src/constants/memoryStatus.js`) rely on the unrounded value.

**Files to create/modify:**

| File | Action |
| --- | --- |
| `frontend/src/utils/formatPercentage.js` | Create — new utility |
| `frontend/src/components/pages/helpers/MemoryStatusHelper.jsx` | Edit — use `formatPercentage(percentage)` |
| `frontend/spec/utils/formatPercentageSpec.js` | Create — unit tests covering the rounding table above plus a real case (`16.326141357421875` → `16.3`) |
| `frontend/spec/components/pages/helpers/MemoryStatusHelperSpec.js` | Update — assert the helper renders the formatted percentage |
| `docs/agents/frontend.md` | Update (owned by `architect`, per `docs/agents/*` convention) — add the `/memory/status` route, `MemoryStatus` component, and `MemoryStatusClient` to the routing table, component hierarchy, source layout, and clients list |

## Benefits
- Matches the precision already used for byte values, giving the memory status card a consistent, readable presentation.
- Keeps the backend payload at full precision, preserving accuracy for threshold/color logic and logging.
- Follows the project's existing utility pattern (`formatBytes.js`), keeping the codebase consistent.
- Brings `docs/agents/frontend.md` up to date with the memory status page, which was added recently but never documented.
