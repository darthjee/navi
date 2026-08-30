# Surface emission counts in StatsHeader

Stop discarding the `emissions` block from `/stats.json` and render it as a group in the always-visible stats strip.

## StatsClient.js

- Extend `DEFAULT_STATS` with `emissions: { extracted: 0, emitted: 0, failed: 0, dead: 0 }`.
- Extend `normalizeStats` to include `emissions: { ...DEFAULT_STATS.emissions, ...data?.emissions }`.

## StatsDisplay.jsx

After the Jobs group, add a `<div className="vr mx-1" />` divider and an Emissions group, mirroring the Workers/Jobs markup:

```jsx
<span className="fw-semibold small">Emissions</span>
<div className="d-flex gap-2">
  <StatItem label="Extracted" value={emissions.extracted} variant="secondary" to="/extractions" />
  <StatItem label="Emitted"   value={emissions.emitted}   variant="success"   to="/emissions" />
  <StatItem label="Failed"    value={emissions.failed}    variant="warning"   to="/emissions" />
  <StatItem label="Dead"      value={emissions.dead}      variant="dark"      to="/emissions" />
</div>
```

`const emissions = stats.emissions;` at the top with the existing `workers` / `jobs` locals. `StatItem` already renders as a router `Link` when `to` is set. Keep the existing `Logs` / `Memory` `StatItem`s.

## Files to Change

- `src/clients/StatsClient.js` — add `emissions` to `DEFAULT_STATS` and `normalizeStats`.
- `src/components/elements/StatsDisplay.jsx` — render the Emissions group (`Extracted` → `/extractions`, `Emitted`/`Failed`/`Dead` → `/emissions`).
