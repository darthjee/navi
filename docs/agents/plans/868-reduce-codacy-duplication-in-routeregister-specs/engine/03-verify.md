# Verify specs, lint and duplication
Run from `source/`:

- `npm run spec` (or `npx jasmine spec/lib/server/RouteRegister*_spec.js` for a quick loop, then the full suite) — all specs must pass, and the number of executed specs for these three files must be greater than or equal to before (record before/after counts).
- `npm run lint` — no new errors or warnings (the helper is under `spec/support/**`, which has the Jasmine lint config).
- `npm run report` (jscpd) before and after the change — the three `RouteRegister*_spec.js` files should show markedly fewer clones and duplicated lines than the figures in the issue (50/49/46 clones; 514/420/426 duplicated lines), and the new helper should not itself introduce a large clone.
- Sanity-check readability: break one production branch temporarily (e.g. change the ForbiddenError status in `RouteRegister.js`) and confirm the failing spec name clearly says which verb and error case failed, then revert it.

## Files to Change
- None (verification only); temporary production edit in the sanity check must be reverted before committing
