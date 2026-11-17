# Frontend Plan: Navi: adopt JobRegistry retention and lifetime failure ratio

Main plan: [plan.md](plan.md)

## Shared contracts

- `GET /stats.json` → `jobs.pruned: { finished: number, dead: number }`; may be absent (older backend). Counters are cumulative and reset to `0` on engine stop.

## Implementation Steps

### Step 1 — Pruned group in StatsDisplay

In `frontend/src/components/elements/StatsDisplay.jsx`, add a separate **Pruned** group right after the Jobs group and before Emissions, with the same `vr mx-1` divider and `fw-semibold small` heading as its neighbours:

```
Workers [Idle][Busy] | Jobs [...] | Pruned [Finished][Dead] | Emissions [...]
```

- Two items: `Finished` (`jobs.pruned.finished`) and `Dead` (`jobs.pruned.dead`).
- Use plain `StatItem` **without `to`** (not `JobStatItem`): evicted jobs can't be listed, and linking to `/jobs/finished` would show resident jobs.
- `variant="light"` for both cards.
- Render the whole group (divider, heading, items) only when `jobs.pruned` exists **and** `finished + dead > 0`. Absent `pruned` must never throw.
- Keep it inline (two items); no new helper file.

### Step 2 — Specs

Extend `frontend/spec/components/StatsDisplay_spec.js`:
- `pruned: { finished: 940, dead: 40 }` → group renders `940` / `40` with labels `Finished` / `Dead`.
- Pruned cards are not wrapped in links and carry `text-bg-light`.
- `pruned: { finished: 0, dead: 0 }` → no Pruned heading or items.
- `pruned: { finished: 5, dead: 0 }` → group renders with both items.
- Payload without `pruned` → renders without throwing and without the group.
- Existing assertions unchanged.

## Files to Change
- `frontend/src/components/elements/StatsDisplay.jsx` — Pruned group.
- `frontend/spec/components/StatsDisplay_spec.js` — cases above.

## CI Checks
- `frontend`: `scripts/ci.sh coverage frontend` and `scripts/ci.sh lint-and-report frontend`; locally `cd frontend && yarn test && yarn lint`.

## Notes
- A small layout shift when the group first appears is accepted.
- Do not rebuild/commit `source/static/` unless the repo's frontend workflow requires it for this kind of change.
