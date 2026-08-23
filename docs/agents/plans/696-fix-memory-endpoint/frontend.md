# Frontend Plan: Fix memory endpoint

Main plan: [plan.md](plan.md)

## Shared contracts

None — this work is self-contained within `frontend/`. `architect`'s
documentation update (see [architect.md](architect.md)) reads your file
paths/names but does not depend on this code landing first.

## Implementation Steps

### Step 1 — Add the `formatPercentage` utility

Create `frontend/src/utils/formatPercentage.js`, following the same shape
as the existing `frontend/src/utils/formatBytes.js` (default-exported
function, no side effects). It must round-half-up to exactly one decimal
place:

```js
const formatPercentage = (value) => {
  return `${(Math.round(value * 10) / 10).toFixed(1)}`;
};

export default formatPercentage;
```

Add `frontend/spec/utils/formatPercentageSpec.js` covering the issue's
rounding table plus a real-world case:

| Input | Expected |
| --- | --- |
| `0.11` | `"0.1"` |
| `0.14` | `"0.1"` |
| `0.15` | `"0.2"` |
| `0.19` | `"0.2"` |
| `16.326141357421875` | `"16.3"` |

### Step 2 — Use it in `MemoryStatusHelper`

In `frontend/src/components/pages/helpers/MemoryStatusHelper.jsx`, import
`formatPercentage` and replace the raw `{percentage}` interpolation:

```jsx
{formatBytes(current)} / {formatBytes(maximum)} ({formatPercentage(percentage)}%)
```

Check for an existing `frontend/spec/components/pages/helpers/MemoryStatusHelperSpec.js`
and update it to assert the rendered output uses the formatted (1-decimal)
percentage rather than a raw value.

## Files to Change

- `frontend/src/utils/formatPercentage.js` — create
- `frontend/spec/utils/formatPercentageSpec.js` — create
- `frontend/src/components/pages/helpers/MemoryStatusHelper.jsx` — edit
- `frontend/spec/components/pages/helpers/MemoryStatusHelperSpec.js` — update

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine-frontend`)
- `frontend`: `npm run lint` (CI job: `checks-frontend`)

## Notes

- Do not touch the backend `/memory/status.json` endpoint — it must keep
  returning full floating-point precision, since
  `frontend/src/constants/memoryStatus.js` (`colorForMemoryStatus`) relies
  on the unrounded value for its threshold logic.
- `Math.round(value * 10) / 10` was verified against the issue's rounding
  table in Node — it round-trips correctly for all listed cases, including
  the `0.15 → 0.2` edge case that plain `toFixed(1)` can get wrong.
