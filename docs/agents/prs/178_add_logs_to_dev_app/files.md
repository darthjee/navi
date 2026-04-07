# Relevant Files: Add Logs to Dev App

## Files to change

- `dev/app/app.js` — import and mount `morgan('combined')` as the first middleware in `buildApp`
- `dev/app/package.json` — add `morgan` to `dependencies` (via `yarn add`)
- `dev/app/yarn.lock` — updated automatically by `yarn add`
