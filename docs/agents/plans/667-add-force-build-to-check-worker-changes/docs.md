# docs Plan: Add Force Build To Check Worker Changes

Main plan: [plan.md](plan.md)

## Shared contracts

- CircleCI pipeline parameter `force_worker_build` (env var
  `FORCE_WORKER_BUILD`) triggers a forced worker release even when
  `worker/` didn't change.
- The new `check-and-publish-worker` job (replacing `check-worker-changes`)
  runs automatically on every navi `\d+.\d+.\d+` release tag, publishing
  `deku-swarm` to npm and pushing a `worker-x.y.z` tag whenever `worker/`
  changed (or was forced) and that version isn't already on npm — both
  steps independently idempotent.
- The previous fully-manual worker release path
  (`check-worker-version-tag`/`npm-publish-worker`, triggered by pushing a
  standalone `worker-x.y.z` tag) is being removed by `architect`'s changes;
  `bump_version.sh worker [version]` remains the way to bump
  `worker/package.json`'s version and the README's Worker Current/Next
  Version badges beforehand — unchanged.
- A new CircleCI project environment variable, `GH_PUSH_TOKEN` (GitHub PAT
  scoped to `darthjee/navi` with Contents: Read-and-write, or classic
  `repo` scope), must be provisioned manually before `check-and-publish-
  worker` can push tags — worth a passing mention, though provisioning it
  is out of scope for this doc.
- `force_worker_build` can only be set by explicitly triggering a new
  CircleCI pipeline (UI "Trigger Pipeline" or API) with that parameter — a
  normal `git push` of a tag can't set it.

## Implementation Steps

### Step 1 — Document the new automatic worker release flow

In `README.md`'s release-badges section (near the existing "Worker Current
Version"/"Worker Next Version" lines), add a short paragraph describing:
tagging navi's own release now automatically publishes `deku-swarm` to npm
and pushes a `worker-x.y.z` tag whenever `worker/` changed since the last
worker release (or `force_worker_build` was explicitly set for that
pipeline run) and that version isn't already published — replacing the
previous fully-manual path. Note that `bump_version.sh worker [version]`
is still how to bump the worker version and badges beforehand, and that
`force_worker_build` is a CircleCI pipeline parameter only settable via
"Trigger Pipeline" (UI/API), not a normal tag push.

## Files to Change

- `README.md` — add documentation of the new automatic worker release flow
  near the Worker version badges.

## Notes

- Keep this addition short — a paragraph, not a new top-level section —
  consistent with how the badges area already reads.
