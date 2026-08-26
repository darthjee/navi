# architect Plan: Add Force Build To Check Worker Changes

Main plan: [plan.md](plan.md)

## Shared contracts

- CircleCI **pipeline parameter** `force_worker_build` (boolean, default
  `false`), exposed to job scripts as env var `FORCE_WORKER_BUILD`
  (`"true"`/`"false"` string).
- New job name: `check-and-publish-worker` (replaces `check-worker-changes`;
  same `version-tag-filters`). `npm-publish`'s `requires` list now includes
  `check-and-publish-worker` instead of `check-worker-changes`.
- New script: `scripts/ci/check-and-publish-worker.sh`, invoked via
  `scripts/ci.sh check-and-publish-worker`.
- New CircleCI project environment variable `GH_PUSH_TOKEN` (a GitHub PAT
  scoped to `darthjee/navi` with Contents: Read-and-write, or classic `repo`
  scope) — used only by `check-and-publish-worker.sh` to push the
  `worker-x.y.z` tag. Provisioning it in CircleCI's project settings is out
  of scope (manual step), but the script must read exactly this env var
  name, matching what `docs` documents.
- Git tag convention is unchanged: `worker-<worker_version>`.

## Steps

- [01 — Add the check-and-publish-worker script](architect/01-add-check-and-publish-worker-script.md)
- [02 — Update .circleci/config.yml](architect/02-update-circleci-config.md)
- [03 — Remove dead scripts and validate](architect/03-remove-dead-scripts-and-validate.md)

## Notes

- `circleci` CLI may not be installed locally; if unavailable, sanity-check
  the YAML with a Node/Python YAML parser instead of skipping validation
  entirely (see step 03).
- `scripts/ci/check-npm-version.sh`'s existing `circleci-agent step halt`
  pattern must **not** be reused as-is inside
  `check-and-publish-worker.sh` — halting the step would also skip the
  independently-idempotent git-tag-push logic that must still run even when
  the npm publish is skipped (e.g. a prior run published to npm but failed
  to push the tag). Implement both idempotency checks (npm version already
  published / tag already exists) as plain in-script conditionals instead,
  each able to proceed independently of the other's outcome.
- No automated CI job lints `.circleci/config.yml` itself today, so there is
  no `## CI Checks` entry for this plan beyond the manual `circleci config
  validate` step called out in step 03.
