# Update .circleci/config.yml

Wire the new job into the pipeline and retire the old advisory-only job:

1. Add a top-level `parameters:` block (CircleCI 2.1 supports this at the
   document root) with `force_worker_build: { type: boolean, default:
   false }`.
2. Replace the `check-worker-changes` job entry (workflow entry + job
   definition) with `check-and-publish-worker`:
   - Workflow entry keeps the same `filters: *version-tag-filters`.
   - Job definition: same `docker: darthjee/circleci_node:0.2.1` image as
     today's `check-worker-changes`/`check-worker-version-tag` jobs (verify
     it has `node`/`npm`/`git` available, which `check-and-publish-worker.sh`
     needs), a `checkout` step, and a run step invoking
     `FORCE_WORKER_BUILD=<< pipeline.parameters.force_worker_build >>
     scripts/ci.sh check-and-publish-worker` (pipeline parameters are
     referenced via `<< pipeline.parameters.<name> >>` in CircleCI 2.1
     YAML).
3. Update `npm-publish`'s `requires` list: replace `check-worker-changes`
   with `check-and-publish-worker`.
4. Remove the `check-worker-version-tag` job (workflow entry + job
   definition) and the `npm-publish-worker` job (workflow entry + job
   definition).
5. Remove the `worker-tag-filters` YAML anchor (`&worker-tag-filters`,
   declared on `check-worker-version-tag`'s `filters:`) — confirm no other
   job still references `*worker-tag-filters` before deleting it (as of
   today's file, only `npm-publish-worker` does, and it's removed in the
   same step).

## Files to Change

- `.circleci/config.yml` — add `parameters:` block; replace
  `check-worker-changes` with `check-and-publish-worker` (workflow entry +
  job); update `npm-publish`'s `requires`; remove `check-worker-version-tag`,
  `npm-publish-worker`, and the `worker-tag-filters` anchor.
