# Dev Plan: Upgrade form-data (4.0.5) — CRLF field-override CVE

Main plan: [plan.md](plan.md)

## Shared contracts

None — see [plan.md](plan.md).

## Implementation Steps

### Step 1 — Pin form-data and re-lock in dev/app

`dev/app/package.json` has no direct dependency on `form-data` — it's pulled in transitively at the vulnerable `4.0.5`. `dev/app` only ships a `yarn.lock` (no `package-lock.json`), so add a yarn `resolutions` entry pinning it to `^4.0.6`:

```json
"resolutions": {
  "form-data": "^4.0.6"
}
```

Run `yarn install` inside `dev/app/` to regenerate `yarn.lock`. Confirm afterwards that `form-data` resolves to `4.0.6` (or higher).

### Step 2 — Pin form-data and re-lock in dev/frontend

Same situation in `dev/frontend/package.json` (transitive, currently via `jsdom`), and again only `yarn.lock` exists there. Add the same yarn `resolutions` entry and run `yarn install` inside `dev/frontend/` to regenerate `yarn.lock`.

## Files to Change

- `dev/app/package.json` — add `resolutions.form-data` pinned to `^4.0.6`
- `dev/app/yarn.lock` — regenerated via `yarn install`
- `dev/frontend/package.json` — add `resolutions.form-data` pinned to `^4.0.6`
- `dev/frontend/yarn.lock` — regenerated via `yarn install`

## CI Checks

- `dev/app`: `npm run coverage` (CI job: `jasmine-dev`, preceded by `scripts/ci.sh setup-dev` to copy common code from `source`)
- `dev/app`: `npm run lint` (CI job: `checks-dev`)
- `dev/frontend`: `npm run coverage` (CI job: `jasmine-dev-frontend`)
- `dev/frontend`: `npm run lint` (CI job: `checks-dev-frontend`)

## Notes

- `form-data` is a dev-only transitive dependency in both directories, so this change has no runtime impact on the dev environment itself — only on test tooling.
