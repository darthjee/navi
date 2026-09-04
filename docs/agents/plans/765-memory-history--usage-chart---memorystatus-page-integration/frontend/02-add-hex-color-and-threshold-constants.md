# Add hex-color and threshold constants

`frontend/src/constants/memoryStatus.js` currently only exports
`CLASS_BY_STATUS` (CSS class names, e.g. `text-memory-high`) and
`colorForMemoryStatus`. `recharts` needs real color values as props
(`<ReferenceLine stroke>`, the overflow indicator), and there is no way today
to derive one from a CSS class in JS. Add a parallel export:

```js
const HEX_BY_STATUS = {
  low: '#495057',
  medium: '#198754',
  high: '#ffc107',
  over: '#dc3545',
};
const OVER_LIMIT_HEX = '#6f42c1';
```

These values must match `MemoryStatus.css`'s `.text-memory-*` rules exactly —
there is no single source of truth between the two today, so keep them in
sync by hand on future palette changes.

Also add the hardcoded default thresholds used for the chart's
`<ReferenceLine>`s, mirroring the backend's `MemoryConfig`
`DEFAULT_THRESHOLDS` (`source/lib/models/configs/MemoryConfig.js`):

```js
const DEFAULT_MEMORY_THRESHOLDS = { medium: 50, high: 75, over: 100 };
```

`/memory/status.json` does not return the deployment's actual configured
thresholds, and exposing them is a backend change explicitly out of scope for
this issue — this hardcoded constant can silently drift from a deployment
that overrides `web.memory.thresholds` (accepted for v1).

## Files to Change

- `frontend/src/constants/memoryStatus.js` — add `HEX_BY_STATUS`,
  `OVER_LIMIT_HEX`, and `DEFAULT_MEMORY_THRESHOLDS` exports, alongside the
  existing `CLASS_BY_STATUS` / `colorForMemoryStatus`.
