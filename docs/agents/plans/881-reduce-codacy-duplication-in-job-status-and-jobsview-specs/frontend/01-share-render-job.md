# Share renderJob and flushAsync
`Job_spec.js` and `Job_status_spec.js` each define an identical router `renderJob` helper, and `Job_status_spec.js` also defines its own `flushAsync` even though `support/async.js` already exports it. Extract `renderJob` into `frontend/spec/support/render_job.js` (same signature, `renderJob(root, id = 'abc-123')`, wrapping `Job` in `MemoryRouter` + `Routes` at `/job/:id`, rendered inside `act`), export it, and import it in both specs. In `Job_status_spec.js`, delete the local `flushAsync` and import it from `../support/async.js`. Remove imports that become unused in each spec (`createElement`, `act`, `MemoryRouter`, `Route`, `Routes`, `Job`) — but keep them where still needed.

## Files to Change
- `frontend/spec/support/render_job.js` — new; exports `renderJob`
- `frontend/spec/components/Job_spec.js` — drop local `renderJob`, import from `../support/render_job.js`, clean unused imports
- `frontend/spec/components/Job_status_spec.js` — drop local `renderJob` and `flushAsync`, import from support, clean unused imports
