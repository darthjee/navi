# Specs

- Extend `frontend/spec/components/MemoryStatus_spec.js` (mirrors the flat
  spec-file layout already used for `frontend/src/components/elements/*` —
  see `MemoryStatusHelper_spec.js` alongside it) to assert the chart
  container (`[data-testid="memory-usage-chart"]`) mounts alongside the
  status card, in the existing "when the status loads successfully"
  describe blocks. Presence only — no geometry assertions.
- Add `frontend/spec/components/MemoryUsageChart_spec.js`: at most a smoke
  test asserting the component renders without throwing given N history
  points (e.g. 0, 1, and several points including one > 100%). No assertions
  on rendered SVG geometry — jsdom can't lay out `recharts`.

## Files to Change

- `frontend/spec/components/MemoryStatus_spec.js` — extend.
- `frontend/spec/components/MemoryUsageChart_spec.js` — new smoke spec.
