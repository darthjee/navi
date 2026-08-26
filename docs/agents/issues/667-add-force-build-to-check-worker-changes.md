# Add Force Build To Check Worker Changes

## Context

Releasing `deku-swarm` (the `worker/` npm package) today requires a manual,
separate step — bump the worker version, then push a `worker-x.y.z` tag —
decoupled from navi's own release in `.circleci/config.yml`. On top of that,
the npm version substitution performed during `npm-publish` is broken:

- `check-worker-changes` (`scripts/ci/check-worker-changes.sh`) only reports
  whether `worker/` changed since the last worker release tag — it never
  publishes anything, and there is no way to force it to behave as if there
  were changes (useful when the heuristic itself is wrong, or for the very
  first release).
- Because of that, publishing `deku-swarm` to npm is an entirely separate,
  manual workflow: bump the worker version, push a `worker-x.y.z` tag, and
  let `check-worker-version-tag` + `npm-publish-worker` run independently.
  Nothing ties this to navi's own release, even though navi's `npm-publish`
  needs `deku-swarm` to already be published on npm.
- `scripts/ci/build-frontend.sh`'s substitution of the workspace-local
  `deku-swarm` dependency is broken:
  `sed -i 's/"deku-swarm": "file:..\//"deku-swarm": "^/' source/package.json`
  only replaces the `file:../` prefix, leaving `"deku-swarm": "^worker"` in
  `source/package.json` instead of a real, resolvable npm version.

## What needs to be done

Tagging navi's own release (`\d+.\d+.\d+`) should become the single action
that reliably produces a `deku-swarm` npm publish when needed:

- If `worker/` didn't change since the last worker release, and
  `force_worker_build` wasn't set, nothing worker-related happens — no
  publish, no tag, no error.
- If `worker/` changed (or `force_worker_build` was explicitly set for that
  pipeline run) and the version in `worker/package.json` isn't already
  published on npm, the release publishes `deku-swarm` to npm and pushes a
  matching `worker-x.y.z` git tag, before navi's own `npm publish` runs.
- Re-running the same release (e.g. after a partial failure) must be safe:
  an already-published npm version and an already-pushed tag are each
  independently skipped rather than retried or erroring.
- `source/package.json`'s `deku-swarm` dependency, after `build-frontend.sh`
  runs, must resolve to a real published npm version instead of the current
  broken `^worker`.

### CI (`.circleci/config.yml` and `scripts/ci/`)

1. **Replace `check-worker-changes` with `check-and-publish-worker`** in
   `.circleci/config.yml` (same `version-tag-filters`, i.e. still runs on
   navi's `\d+.\d+.\d+` release tag):
   - Detects whether `worker/` changed since the last worker release
     (reusing today's `check-worker-changes.sh` logic), or is forced via a
     new `force_worker_build` CircleCI **pipeline parameter** (exposed to
     the job/script as env var `FORCE_WORKER_BUILD`).
   - No changes and not forced → no-op, exits successfully (nothing
     published, no error).
   - Changes present, or forced → checks whether `worker/package.json`'s
     version is already published on npm (reusing today's
     `check-npm-version.sh` logic, to stay idempotent), and if not:
     - installs `worker/` deps and runs `npm publish` for it (reusing
       today's `publish.sh` logic) — this must complete **before**
       `npm-publish`, since navi's own `npm publish` needs `deku-swarm` to
       already be resolvable from the npm registry.
     - creates and pushes a `worker-<worker_version>` git tag to GitHub as
       the release marker (matching the existing `worker-X.Y.Z` tag
       convention already referenced by `README.md`/`bump_version.sh`),
       using the CircleCI project's existing push-capable credentials.
2. **Update `npm-publish`'s `requires`** in the workflow to depend on
   `check-and-publish-worker` instead of `check-worker-changes`.
3. **Fix the `deku-swarm` version substitution** in
   `scripts/ci/build-frontend.sh`: replace the whole
   `"deku-swarm": ".*"` value with the literal version read from
   `worker/package.json`, e.g. `"deku-swarm": "<worker_version>"`, instead
   of the current broken
   `s/"deku-swarm": "file:..\//"deku-swarm": "^/` that leaves `^worker`
   behind.
4. **Remove the now-redundant separate worker release path**: the
   `check-worker-version-tag` and `npm-publish-worker` jobs, their workflow
   entries, and the `worker-tag-filters` anchor (only used by those two
   jobs). With `check-and-publish-worker` publishing `deku-swarm` directly
   as part of navi's own release, and `force_worker_build` covering the
   "first release" / manual-force case, the separate
   `worker-x.y.z`-tag-triggered workflow has no remaining purpose.
   `scripts/check_worker_tag_version.sh` becomes dead code and should be
   removed too.
5. Remove `scripts/ci/check-worker-changes.sh` (superseded by the new
   `check-and-publish-worker` script(s)).

### Scope

**In scope:**
- `.circleci/config.yml`: replace `check-worker-changes` with
  `check-and-publish-worker`, add a `force_worker_build` pipeline
  parameter, update `npm-publish`'s `requires`, remove the
  `check-worker-version-tag`/`npm-publish-worker` jobs and the
  `worker-tag-filters` anchor.
- `scripts/ci/check-worker-changes.sh`: removed, replaced by the new
  `check-and-publish-worker` script(s), reusing the existing
  `check-npm-version.sh`/`publish.sh` logic.
- `scripts/check_worker_tag_version.sh`: removed (dead code once the
  separate `worker-x.y.z`-tag workflow is gone).
- `scripts/ci/build-frontend.sh`: fix the `deku-swarm` version
  substitution.
- Documentation describing the new, automatic worker release flow (see
  "Documentation" below).

**Out of scope:**
- Actually creating/configuring the CircleCI project environment variable
  or token — that remains a manual action performed in CircleCI's project
  settings (same pattern as the existing `NPM_TOKEN`), using the
  permissions documented below under "CI credentials".
- Detecting or enforcing that `worker/package.json`'s version was bumped
  when `worker/` changed. If `worker/` changed but the version wasn't
  bumped, `check-and-publish-worker` will see the version as already
  published and no-op silently — same reliance on human diligence as
  today. No new safeguard is being added here.
- Any change to `deku-swarm`'s own versioning or changelog strategy.

### CI credentials

The new git-tag-push step needs a GitHub token capable of pushing tags to
`darthjee/navi`. No such credential exists in this repo/CircleCI project
today. It should be added as a CircleCI project environment variable,
following the same pattern as the existing `NPM_TOKEN`:

- Fine-grained GitHub PAT: repository access scoped to `darthjee/navi`,
  with **Contents: Read and write** permission (covers pushing tags/refs).
- Classic PAT alternative: `repo` scope.

Provisioning this env var in CircleCI's project settings is a manual step
performed separately (out of scope for the code change itself), but must be
documented so it's clear what's needed before `check-and-publish-worker`
can succeed.

### Documentation

Add/update documentation describing the new, automatic worker release
flow — e.g. in `README.md`'s release-badges section and/or
`docs/agents/worker.md` — now that the previous fully-manual path (bump
`worker/package.json`'s version, push a `worker-x.y.z` tag, let
`check-worker-version-tag` + `npm-publish-worker` run independently) is
being removed. The new flow: tagging navi's own release triggers
`check-and-publish-worker`, which publishes `deku-swarm` to npm and pushes
a `worker-x.y.z` tag automatically whenever `worker/` changed (or
`force_worker_build` is set) and that version isn't already published on
npm. `bump_version.sh worker [version]` remains the way to bump
`worker/package.json`'s version and the README's Worker Current/Next
Version badges beforehand — that part is unchanged.

### Edge cases to account for

- **npm-publish vs. git-tag-push desync**: "worker/ changed since last
  release" and "worker/package.json's version already published on npm"
  are two independent signals that can fall out of sync (e.g. `npm publish`
  succeeds but the subsequent tag push fails, or a job is manually re-run
  after a partial failure). `check-and-publish-worker` must treat "publish
  to npm" and "push the `worker-x.y.z` tag" as two **separately
  idempotent** steps, each checked and skipped independently, so a partial
  failure self-heals on the next run.
- **Worker-publish failure blocks the navi release**: coupling
  `check-and-publish-worker` into `npm-publish`'s `requires` means a
  worker-publish failure now blocks navi's own release entirely, even when
  navi's own code didn't change. This is intentional.
- **Detection needs an actual signal, not just log output**: today's
  `check-worker-changes.sh` exits `0` in every branch — it's purely
  advisory and nothing parses its output. The new script/job logic must
  translate "changed since last release" (or `FORCE_WORKER_BUILD`) into
  something `check-and-publish-worker`'s own control flow can act on (e.g.
  a distinct exit code, or a variable written for later steps in the same
  job).
- **Pushing the `worker-x.y.z` tag re-triggers a CircleCI pipeline**: the
  test-suite jobs filter on `tags: only: /.*/`, so pushing a new
  `worker-x.y.z` tag from within `check-and-publish-worker` will itself
  kick off a fresh CircleCI pipeline that runs the full test suite for that
  tag (though not `check-version-tag`/`npm-publish`, since
  `version-tag-filters` requires the tag to fully match `\d+\.\d+\.\d+`).
  This is harmless but consumes extra CI minutes.
- **Git identity for tagging in CI**: creating a git tag from the CircleCI
  job needs a configured `git config user.name`/`user.email` in the
  `check-and-publish-worker` job's environment/checkout, which isn't set up
  today.
- **Invoking `force_worker_build` in practice**: it's a CircleCI pipeline
  parameter, so it can only be supplied by explicitly triggering a new
  pipeline (CircleCI UI's "Trigger Pipeline" or the API) targeting the
  desired tag/branch with that parameter set — a normal `git push` of a tag
  can't set it. This should be spelled out in the documentation added by
  this issue.

### Testing strategy

No `scripts/ci/*.sh` script has automated tests today — they've only ever
been validated by running them for real in CircleCI. This issue follows the
same pattern: manual verification, no new test framework introduced.

Before merging:
- Validate the restructured `.circleci/config.yml` (new `parameters:`
  block, renamed job, updated `requires`, removed anchors/jobs) with
  `circleci config validate` (or equivalent), to catch YAML/anchor/
  reference mistakes without needing a real pipeline run.
- Exercise the change-detection and already-published-on-npm logic against
  a scratch clone (simulate `worker/` changes and prior `worker-x.y.z` tags
  locally) to confirm the exit-code/signal behavior branches as intended,
  for both the "changed" and "forced" paths.
- Manually verify the `build-frontend.sh` sed fix against a sample
  `source/package.json` containing
  `"deku-swarm": "file:../worker"`, confirming the result is a real
  resolvable version (e.g. `"deku-swarm": "1.6.4"`) rather than the current
  broken `^worker`.

Before relying on this for a real release:
- **Dry-run the npm publish**: run `npm publish --dry-run` against the
  current `worker/package.json` to confirm the package name, version, and
  file list resolve correctly before the first real publish goes out.
- **Verify idempotency by re-running twice**: after a (real or dry-run)
  publish, re-run `check-and-publish-worker` again and confirm it correctly
  no-ops — skips the npm publish and skips the tag push independently —
  rather than erroring or attempting a double-publish.

## Acceptance criteria

- [ ] `.circleci/config.yml` has a `force_worker_build` pipeline parameter
      (exposed as `FORCE_WORKER_BUILD`) and a `check-and-publish-worker` job
      that replaces `check-worker-changes`, still gated by
      `version-tag-filters`.
- [ ] `check-and-publish-worker` no-ops (no publish, no tag, no error) when
      `worker/` hasn't changed since the last worker release and
      `force_worker_build` is not set.
- [ ] `check-and-publish-worker`, when `worker/` changed or
      `force_worker_build` is set, publishes `deku-swarm` to npm and pushes
      a `worker-<version>` tag when that version isn't already published —
      and runs before `npm-publish` (`npm-publish`'s `requires` updated
      accordingly).
- [ ] Both the npm publish step and the git tag push step are independently
      idempotent — re-running `check-and-publish-worker` after a partial or
      full success skips whichever part already completed, without
      erroring.
- [ ] `scripts/ci/build-frontend.sh` substitutes `deku-swarm`'s version in
      `source/package.json` with the real literal version from
      `worker/package.json` (not the broken `^worker` value).
- [ ] The `check-worker-version-tag` and `npm-publish-worker` jobs, their
      workflow entries, and the `worker-tag-filters` anchor are removed.
- [ ] `scripts/ci/check-worker-changes.sh` and
      `scripts/check_worker_tag_version.sh` are removed.
- [ ] `.circleci/config.yml` passes `circleci config validate` (or
      equivalent) after the restructuring.
- [ ] Documentation (e.g. `README.md`'s release-badges section and/or
      `docs/agents/worker.md`) describes the new, automatic worker release
      flow and how to use `force_worker_build`.
