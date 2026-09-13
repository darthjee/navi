# frontend Plan: Upgrade react-router (7.14.2) — DoS and CSRF bypass CVEs

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Bump react-router-dom and re-lock
Change the pinned `react-router-dom` version in `frontend/package.json` from `7.14.2` to `7.18.3` (latest 7.x release; clears the `>=7.18.2` fix threshold for all 3 flagged CVEs). `react-router` itself is not a direct dependency anywhere in the repo — it is pulled in transitively by `react-router-dom`, which pins its own `react-router` dependency to the exact same version in lockstep, so bumping `react-router-dom` is the only way to move `react-router` past the vulnerable range. Regenerate `frontend/package-lock.json` and `frontend/yarn.lock` (`npm install` and `yarn install` respectively, run from `frontend/`) and confirm both lockfiles now resolve `react-router` to `7.18.3`.

### Step 2 — Verify nothing broke
Run the frontend lint and test suite locally to confirm the bump is a clean drop-in (React Router v7 minor releases between 7.14 and 7.18 are not expected to carry breaking API changes, but this must be verified rather than assumed):
- `cd frontend && npm run lint`
- `cd frontend && npm run coverage`

Pay particular attention to any code using APIs touched by the CVE fixes (manifest/`__manifest` fetching, RSC actions) if the frontend uses React Router's RSC or manifest-loading features — grep for `__manifest` and RSC-related imports first to confirm whether this app is even exposed to those specific code paths, since the CVEs may not be exercised by this app's usage regardless.

## Files to Change
- `frontend/package.json` — bump `react-router-dom` from `7.14.2` to `7.18.3`
- `frontend/package-lock.json` — re-locked after the bump
- `frontend/yarn.lock` — re-locked after the bump

## CI Checks
- `frontend`: `scripts/ci.sh lint-and-report frontend` (CI job: `checks-frontend`)
- `frontend`: `cd frontend; npm run coverage` (CI job: `jasmine-frontend`)

## Notes
- `source/` does not depend on `react-router` or `react-router-dom` at all — no changes needed there.
- No `react-router-dom` API changes are anticipated for this minor-version range, but the version bump should still be validated against the app's actual usage (see Step 2) rather than assumed safe.
