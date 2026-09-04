# Frontend Plan: Memory history: usage chart + MemoryStatus page integration

Main plan: [plan.md](plan.md)

## Steps

- [01 — Add recharts dependency](frontend/01-add-recharts-dependency.md)
- [02 — Add hex-color and threshold constants](frontend/02-add-hex-color-and-threshold-constants.md)
- [03 — Build MemoryUsageChart component + helper](frontend/03-build-memoryusagechart-component-and-helper.md)
- [04 — Integrate chart into MemoryStatus page](frontend/04-integrate-chart-into-memorystatus-page.md)
- [05 — Specs](frontend/05-specs.md)

## CI Checks

- `frontend`: `yarn coverage` (CI job: `jasmine-frontend`)
- `frontend`: `yarn lint` (CI job: `checks-frontend`)

## Notes

- No render spec for `MemoryUsageChart` beyond a throws-nothing smoke test —
  jsdom (the test env) has no `canvas`/layout support, so it can't lay out
  `recharts`' SVG. Visual correctness (line shape, reference lines, overflow
  indicator) must be verified by hand in a browser.
- The threshold percentages (`medium`/`high`/`over`) and the hex color values
  are both hardcoded frontend constants (see step 02) because
  `/memory/status.json` doesn't return `MemoryConfig`'s configured thresholds,
  and exposing them is a backend change explicitly out of scope for this
  issue. If a deployment overrides `web.memory.thresholds`, the chart's
  reference lines will silently disagree with the actual configured values —
  accepted for v1 per the issue's discussion.
