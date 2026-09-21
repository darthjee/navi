# Adopt helpers in StatsHeader and verify
In `StatsHeader_spec.js`:

- Remove the local `flushAsync` and import it from `../support/async.js`.
- Replace the `while loading` block and the `when the fetch fails` block with `itBehavesLikeFetchStates({ state, render: () => renderStatsHeader(state.root), loadingText: 'Loading stats', errorText: 'Failed to load stats', status: 503 })`. Confirm the actual error message text in the existing block before hardcoding `errorText`.
- Drop the now-unused `noop` and `mockFetchFailure` imports; keep `mockFetchSuccess`.

Then verify the whole change from `frontend/`:
- `npm run lint` passes (ESLint already covers `spec/support/**/*.js`).
- `npm test` (or `npm run spec`) passes, and the five specs report the same scenarios as before, plus the extra "no spinner" assertion for Emissions and Extractions. Compare `it` counts before/after to confirm nothing was dropped.
- Optionally run jscpd over `frontend/spec/` (e.g. `npx jscpd spec/`) to sanity-check that duplication in the five files dropped; the authoritative number is Codacy on the PR.

## Files to Change
- `frontend/spec/components/StatsHeader_spec.js` — use shared `flushAsync` and `itBehavesLikeFetchStates`
