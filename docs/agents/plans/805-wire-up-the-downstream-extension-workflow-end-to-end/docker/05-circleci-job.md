# `smoke-extensions` CircleCI job

A new job in `.circleci/config.yml` that runs the smoke check on every PR.

## What to do

Add a job that needs a real Docker daemon with host bind-mounts — so
`machine: true` (as `build-and-release` uses), **not** the `node-ci` Docker
executor and **not** `setup_remote_docker` (remote docker cannot bind-mount host
paths):

```yaml
  smoke-extensions:
    machine: true
    steps:
      - checkout
      - run:
          name: Boot the composed stack with the example extension and assert
          command: make smoke-extensions
```

Wire it into `workflows.test-and-release.jobs` with the branch+tag anchor filter
and **no `requires:`** (independent, every PR):

```yaml
      - smoke-extensions:
          filters: *all-tags
```

- Do **not** add it to `coverage-final`'s `requires:`.
- Optionally gate `npm-publish` on it by appending `smoke-extensions` to that
  job's `requires:` list — recommended, so a broken extension path blocks a
  release, but keep it a single-line change and call it out in the PR.
- The `machine` executor already has `make`, `docker`, `docker compose`, `curl`;
  confirm `jq` (step 04 falls back to `node -e` if not).
- `make smoke-extensions` itself runs `make build-dev` + the example `npm`
  build + `docker compose up`/`down`, so the job body stays one line.

## Files to Change

- `.circleci/config.yml` — new `smoke-extensions` job + one entry in the
  `test-and-release` workflow's job list (+ optional `npm-publish` `requires:`
  addition).

## Notes

- CI never builds the production image except on version tags; this job uses
  `navi:dev` via `make build-dev`, matching the local target.
- Job runtime ≈ dev image build + `npm ci` + Vite build + compose boot; acceptable
  for a per-PR job but it is the slowest non-release job — keep the retry budget
  in `scripts/smoke/extensions.sh` tight.
