# Issue: Refactor CircleCI config

## Description
Refactor `.circleci/config.yml` to eliminate redundancy by adopting CircleCI 2.1 `executors` and `commands`, and by extracting complex inline shell logic into a router script `scripts/ci.sh` that dispatches to sub-scripts under `scripts/ci/*.sh`.

## Problem
The config declares `version: 2.1` but uses zero 2.1 features, leading to significant duplication:

| # | Pattern | Occurrences | Complexity |
| --- | --- | --- | --- |
| 1 | Filter `tags: only: /.*/` | ~14 jobs | Low (declarative) |
| 2 | Filter `tags: only: /\d+.\d+.\d+/` | ~8 jobs | Low (declarative) |
| 3 | Docker image `darthjee/circleci_node:0.2.1` | ~16 jobs | Low → Executor |
| 4 | Pattern: checkout → install → coverage → Codacy | 5 jobs | Medium → Command |
| 5 | Pattern: checkout → install → lint → JSCPD | 5 jobs | Medium → Command |
| 6 | Copy common code (rm + cp) | 2 jobs | Medium → Script |
| 7 | NPM auth + publish inline | 2 jobs | Medium → Script |
| 8 | Codacy partial coverage upload | 5 jobs | Medium → Script |
| 9 | Codacy final coverage | 1 job | Low → Script |

## Expected Behavior
- Jobs use a `node-ci` executor (`darthjee/circleci_node:0.2.1`) and a `scripts-ci` executor (`darthjee/scripts:0.6.0`) instead of repeating Docker image declarations in ~16 jobs.
- Jobs use reusable commands — `install-deps`, `run-tests` (test + Codacy partial upload), `lint-and-report` — instead of repeating step sequences across jobs.
- Complex inline shell (copying common code, NPM publish auth, Codacy coverage upload) is extracted into `scripts/ci.sh <action> [args]`, dispatching to sub-scripts under `scripts/ci/*.sh`.
- Release/deploy jobs (`build-and-release*`, `update-description*`) remain untouched — they already delegate to `Makefile`/`scripts/deploy.sh` and further wrapping would add unnecessary indirection.
- Acceptance requires a full CI run on the PR with all jobs passing exactly as before the refactor, **except** that a Codacy step failure is not blocking — Codacy failures are ignored today and must continue to be ignored after the refactor.
- Lands as a single PR — executors, commands, and script extraction are interdependent (the new commands call the new scripts), so splitting them into phases would leave an inconsistent intermediate state.

## Solution
### CircleCI 2.1 executors
- **node-ci:** `darthjee/circleci_node:0.2.1` — used by all test, check, coverage, and publish jobs.
- **scripts-ci:** `darthjee/scripts:0.6.0` — used by description-update jobs.

### CircleCI 2.1 commands
- **install-deps:** runs `yarn install` in a given directory.
- **run-tests:** runs `npm run coverage` + Codacy partial upload via `scripts/ci.sh`.
- **lint-and-report:** runs `npm run lint` + `npm run report`.

### Script extraction (router pattern)
`scripts/ci.sh` acts as a router, dispatching to sub-scripts under `scripts/ci/*.sh`:

| Sub-script | Action | Argument(s) | Replaces in YAML |
| --- | --- | --- | --- |
| `setup-dev.sh` | setup-dev | — | "Copy common code from source" steps |
| `publish.sh` | publish | source \| clients/node | NPM auth + publish logic |
| `coverage.sh` | coverage | [path] | Codacy partial upload in 5 test jobs |
| `coverage-final.sh` | coverage-final | — | Codacy final in `coverage-final` job |

### Decisions
- The router script (`scripts/ci.sh`) gives CI actions a single entry point, reducing the YAML surface area.
- Codacy coverage extraction is prioritized due to its high frequency (5 occurrences).
- Filters (`tags: only: /.*/`, version-tag patterns) are left declarative as-is — low complexity, no clear benefit from further abstraction.
- Release and deploy steps are left untouched, since they already delegate to external tooling.

## Benefits
- Eliminates ~16 repeated Docker image declarations and ~10 repeated step sequences from the YAML.
- Centralizes CI action logic (coverage upload, publish auth, dev setup) behind a single script entry point, easing future changes and making the logic testable outside of CircleCI YAML.
- Shrinks `.circleci/config.yml` to mostly declarative job/workflow wiring.
