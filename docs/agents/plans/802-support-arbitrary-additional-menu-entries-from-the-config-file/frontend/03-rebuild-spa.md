# Rebuild the SPA

The built assets are committed under `source/static/` (as in IMPL-1). After the
CSS/JSX change in step 01, rebuild so the committed bundle matches source.

- Run the frontend build (`scripts/ci.sh build-frontend`, or `cd frontend &&
  npm run build`) and commit the regenerated `source/static/` output.
- Confirm the diff is limited to the menu dropdown style change (plus the usual
  hashed-filename churn) — no unrelated bundle changes.

## Files to Change

- `source/static/**` — regenerated build output (committed).
