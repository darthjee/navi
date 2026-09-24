# Verify size, lint and coverage

In `source/`:

1. `wc -l spec/lib/jobs/emit_job/*.js spec/support/utils/EmitJobSpecUtils.js` — every file under 300 lines.
2. `yarn spec` — all green; the spec count for EmitJob should match the pre-split count (compare `yarn spec` totals before and after, allowing only the same number of examples from the reshaped cooldown table).
3. `yarn lint` — no errors and no `max-lines` warning.
4. `yarn report` — no new duplication introduced between the three spec files.
5. `npm run coverage` — `lib/jobs/EmitJob.js` coverage unchanged.

## Files to Change
- None (verification only).
