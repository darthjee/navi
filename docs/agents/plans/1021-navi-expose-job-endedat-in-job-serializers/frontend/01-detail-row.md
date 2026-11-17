# "Ended at" row on the job detail page

Add an "Ended at" `<dt>`/`<dd>` pair to the job detail `<dl>` in `JobDetailsHelper.render`. Follow the existing conditional-row components (`ReadyInRow`, `RemainingAttempts`): create a small `EndedAtRow` component that renders nothing when `job.endedAt` is falsy, and otherwise renders `<dt className="col-sm-3">Ended at</dt><dd className="col-sm-9">{formatTimestamp(job.endedAt)}</dd>`. Place it near the status-specific rows (e.g. before `RemainingAttempts`).

Hiding the row when `null` keeps the detail page clean for non-terminal jobs. The API field itself is always present.

## Files to Change

- `frontend/src/components/elements/EndedAtRow.jsx` (new) — conditional "Ended at" row.
- `frontend/src/components/elements/helpers/JobDetailsHelper.jsx` — render `<EndedAtRow job={job} />`.
