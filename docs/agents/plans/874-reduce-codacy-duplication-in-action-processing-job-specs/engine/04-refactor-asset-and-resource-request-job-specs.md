# Refactor AssetDownloadJob and ResourceRequestJob specs

Replace the repeated setup with `AssetDownloadJobFactory`, the existing `ResourceRequestJobFactory` and the `logContext` helper, and use the lifecycle example from step 02 for the scenarios that are truly shared. Keep job-specific scenarios inline: `AssetDownloadJob` client fallback/named client, unexpected-status handling, leaf-node check; `ResourceRequestJob` URL resolution, enqueue calls, assets and parser branches. Fold any remaining internal duplicates in these two files (the repeated `enqueue*` spies in the assets/parser `beforeEach`, the repeated `perform` + `expectAsync(...).toBeResolvedTo(response)` opening) into local helpers only where it keeps the spec readable.

Finish by running the full `source` spec suite and lint, and compare a local `jscpd` report before/after for the four files.

## Files to Change
- `source/spec/lib/jobs/AssetDownloadJob_spec.js` — use `AssetDownloadJobFactory`, `logContext` helper and lifecycle example
- `source/spec/lib/jobs/ResourceRequestJob_spec.js` — use `logContext` helper and lifecycle example; tidy local duplicated setup
