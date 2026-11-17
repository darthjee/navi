# "Ended at" column in the jobs table

Add an "Ended at" header after "URL" in `JobsTableHelper.renderHeader`. Add a matching cell in `JobRow` rendering `formatTimestamp(job.endedAt)`, which shows `—` when `null`, consistent with the URL cell's `—`.

## Files to Change

- `frontend/src/components/elements/helpers/JobsTableHelper.jsx` — new `<th>Ended at</th>`.
- `frontend/src/components/elements/JobRow.jsx` — new `<td>{formatTimestamp(job.endedAt)}</td>`.
