# Architect Plan: Provide a Jasmine test harness for downstream extension code

Main plan: [plan.md](plan.md)

This file exists because the CI, `Makefile`, and `scripts/` wiring is
architect-owned root-level infrastructure (`.claude/agents/architect.md` scope)
that no specialist can take — `docker`, `guide`, and `docs` all list
`.circleci/config.yml` / `Makefile` as out-of-scope. Sequence: **after `docker`
Step 1** (the image must build) and **after `guide` Step 1** (the example must
be image-ready), since the self-test job runs the example through the image.

## Shared contracts

Consumed from `docker` (see [plan.md](plan.md#shared-contracts)):

- `dockerfiles/navi-hey-test/Dockerfile`, context = repo root, amd64 only.
- Run form: `docker run --rm -v <src>:/work/src:ro -v <tests>:/work/tests:ro
  darthjee/navi-hey-test:<tag> [all|backend|frontend] [--coverage]`.
- Root `docker-compose.yml` `navi_hey_test` service (built by `docker` Step 2)
  that already mounts `examples/navi-orders-extension/{src,tests}`.

Produced for `docs` / `guide`: the image tag scheme
`darthjee/navi-hey-test:<git-tag>` + `:latest`, released from a version-tag CI
job.

## Implementation Steps

### Step 1 — `Makefile` + `scripts/` targets

Mirror the existing `build-image` / `release` / `smoke-extensions` structure in
`Makefile`:

- Variables: `DOCKERFILE_NAVI_HEY_TEST ?=
  dockerfiles/navi-hey-test/Dockerfile`, `NAVI_HEY_TEST_IMAGE :=
  darthjee/navi-hey-test`.
- `build-navi-hey-test:` — `docker build -f $(DOCKERFILE_NAVI_HEY_TEST) . -t
  $(NAVI_HEY_TEST_IMAGE):latest` (add `--platform $(PLATFORM)` +
  `-t $(NAVI_HEY_TEST_IMAGE):$(TAG)` in a `build-image-navi-hey-test:` variant
  guarded by `TAG`, like `build-image`).
- `release-navi-hey-test:` — guard `TAG`, `$(MAKE) build-image-navi-hey-test
  TAG=$(TAG)`, `docker login` (same `DOCKER_HUB_PASSWORD` / `DOCKER_HUB_USERNAME`
  env as `release`), `docker push` both tags.
- `test-extension-harness:` — `$(MAKE) build-navi-hey-test`, then
  `cd $(EXTENSION_EXAMPLE_DIR) && npm ci` (no build needed — specs run against
  `src/`), then run the suite through the image:
  `docker run --rm -v "$(PWD)/$(EXTENSION_EXAMPLE_DIR)/src:/work/src:ro"
  -v "$(PWD)/$(EXTENSION_EXAMPLE_DIR)/tests:/work/tests:ro"
  $(NAVI_HEY_TEST_IMAGE):latest all`
  (or `$(COMPOSE) run --rm navi_hey_test all` if the root compose service is
  preferred). Non-zero image exit fails the target.
- Add all four targets to the `.PHONY` line.
- If a shell helper fits the `scripts/` pattern better (see
  `scripts/smoke/extensions.sh`), factor the `docker run` invocation into
  `scripts/test/extension_harness.sh` and call it from the target. Optional.

### Step 2 — `.circleci/config.yml` jobs

- **`test-extension-harness`** — new job, `machine: true` (needs Docker to
  build + run the image), `steps: [checkout, run: make test-extension-harness]`.
  Add to the `workflows.test-and-release.jobs` list with `filters: *all-tags`.
  Add it to **`npm-publish`**'s `requires:` list (alongside the existing
  `smoke-extensions`) so a broken harness blocks release, matching how
  `smoke-extensions` already gates.
- **`build-and-release-navi-hey-test`** — new job, `machine: true`,
  `steps: [checkout, run: make release-navi-hey-test TAG=${CIRCLE_TAG}]`.
  `filters: *version-tag-filters`. `requires: [build-and-release]` (so it
  publishes after the main image, same as `build-and-release-demo` /
  `build-and-release-demo-app`). It transitively depends on `npm-publish`, which
  already `requires` `jasmine` / `jasmine-frontend` / `checks` /
  `checks-frontend` — SPEC-6 §8's "requires the existing test/lint jobs" is
  satisfied through that chain; add them to this job's `requires` directly too
  if you want it explicit.
- Do **not** add an arm64 variant (plan Notes: Navi is amd64-only).

Verify with `circleci config validate .circleci/config.yml` if the CLI is
available; otherwise eyeball against the `build-and-release-demo-app` +
`smoke-extensions` precedents.

## Files to Change

- `Makefile` — `build-navi-hey-test`, `build-image-navi-hey-test`,
  `release-navi-hey-test`, `test-extension-harness` targets + `.PHONY` +
  variables.
- `.circleci/config.yml` — `test-extension-harness` job (+ into `npm-publish`
  `requires`) and `build-and-release-navi-hey-test` job (version-tag gated).
- `scripts/test/extension_harness.sh` — **new, optional**: extracted `docker
  run` invocation for the harness self-test.

## CI Checks

- `.circleci/config.yml` — `circleci config validate` (if available).
- New job `test-extension-harness` must go green on this branch's PR: it builds
  `dockerfiles/navi-hey-test/` and runs `examples/navi-orders-extension/tests/`
  through it.
- `build-and-release-navi-hey-test` only runs on `\d+.\d+.\d+` tags — cannot be
  exercised on the PR; review by precedent.

## Notes

- Keep the release job's Docker Hub auth identical to `release:` /
  `release-client:` (`echo "$DOCKER_HUB_PASSWORD" | docker login -u
  "$DOCKER_HUB_USERNAME" --password-stdin`).
- The existing `smoke-extensions` job stays as-is — it covers the composed-stack
  HTTP path; the new job covers the unit-harness path. They are complementary,
  not a replacement.
- If `docker` extracted a `dev_navi_hey-base` stage, sanity-check that
  `make build-dev` / `make build-dev-app` and the `jasmine-dev*` jobs still
  pass — that refactor is out of this issue's required scope but must not
  regress the dev images.
- `check_tag_version.sh` currently checks `package.json` + README versions
  against the git tag; the `navi-hey-test` image is versioned by the same Navi
  tag, so no change to that script is needed.
