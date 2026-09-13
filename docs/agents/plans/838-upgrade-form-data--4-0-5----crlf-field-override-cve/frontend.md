# Frontend Plan: Upgrade form-data (4.0.5) — CRLF field-override CVE

Main plan: [plan.md](plan.md)

## Shared contracts

None — see [plan.md](plan.md).

## Implementation Steps

### Step 1 — Pin form-data and re-lock

`frontend/package.json` has no direct dependency on `form-data` — it's pulled in transitively (currently via `jsdom`, a dev dependency) at the vulnerable `4.0.5`. Add both an npm `overrides` entry and a yarn `resolutions` entry pinning it to `^4.0.6`, then regenerate both lockfiles so the fix takes in whichever package manager reads them:

```json
"overrides": {
  "form-data": "^4.0.6"
},
"resolutions": {
  "form-data": "^4.0.6"
}
```

Run `npm install` and `yarn install` inside `frontend/` to regenerate `package-lock.json` and `yarn.lock`. Confirm afterwards that `form-data` resolves to `4.0.6` (or higher) in both lockfiles and that no other version of it remains.

## Files to Change

- `frontend/package.json` — add `overrides.form-data` and `resolutions.form-data` pinned to `^4.0.6`
- `frontend/package-lock.json` — regenerated via `npm install`
- `frontend/yarn.lock` — regenerated via `yarn install`

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine-frontend`)
- `frontend`: `npm run lint` (CI job: `checks-frontend`)

## Notes

- `form-data` is a dev-only transitive dependency here (via `jsdom`), so this change has no runtime/production impact — it only affects test tooling.
