# Engine Plan: Upgrade axios (1.13.6) — 10+ High severity CVEs

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Bump axios to 1.20.0 and re-lock
In `source/`, upgrade the resolved `axios` version from `1.13.6` to `1.20.0` (still within the existing `^1.13.0` range in `source/package.json`, so that file needs no edit unless the caret range is tightened). Re-lock both `source/package-lock.json` and `source/yarn.lock` so the resolved version, integrity hash, and dependency tree are updated to `1.20.0`.

### Step 2 — Verify no regression
Run the `source` test suite and confirm `source/lib/client/Client.js`'s GET/POST/PUT/PATCH flows (used via `spec/lib/client/Client_spec.js`, `spec/lib/jobs/*_spec.js`, and `spec/support/utils/AxiosUtils.js`) still pass unchanged, since the client uses only basic request options (`timeout`, `headers`, `maxRedirects`, `validateStatus`, `responseType`) with no proxy or XSRF-cookie configuration affected by the CVE fixes. Also run lint, since it's part of the same CI job group.

## Files to Change
- `source/package-lock.json` — re-lock `axios` to `1.20.0`
- `source/yarn.lock` — re-lock `axios` to `1.20.0`
- `source/package.json` — only if the `^1.13.0` range needs tightening; otherwise unchanged

## CI Checks
- `source`: `npm run coverage` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes
- `frontend/` has no `axios` dependency (direct or transitive) — confirmed via `package.json`/`package-lock.json`/`yarn.lock` search — so no changes are needed there, despite the original issue listing frontend lockfiles as affected locations.
- No behavior change is expected: `Client.js` doesn't use any of the axios options touched by the patched CVEs (proxy config, XSRF cookies, form-data uploads).
