# Architect Plan: Rename worker/ folder to deku-swarm/

Main plan: [plan.md](plan.md)

## Shared contracts

The full table lives in [plan.md](plan.md#shared-contracts). The architect produces the CircleCI job names (`jasmine-deku-swarm` / `checks-deku-swarm`), the `bump_version.sh` target `deku-swarm`, `release.yml` `folder: deku-swarm`, the agent `deku-swarm` and the doc `docs/agents/deku-swarm.md`.

## Steps

- [01 — Release config and CircleCI](architect/01-release-and-ci.md)
- [02 — Scripts](architect/02-scripts.md)
- [03 — Agent docs and cross-references](architect/03-agent-docs.md)
- [04 — Rename the worker agent (last)](architect/04-rename-agent.md)

## CI Checks
- `scripts/ci.sh validate-release-yml` (CI job: `validate-release-yml`)
- `scripts/ci.sh cascade-bump-check` (CI job: `cascade-bump-check`)
- `cd scripts/release && npm run coverage` (CI job: `jasmine-release`)
- `DRY_RUN=1 scripts/ci/release-npm-package.sh deku-swarm` publishes nothing.
- `scripts/bump_version.sh deku-swarm <version>` dry check (no commit).

## Notes
- Run the acceptance grep from [plan.md](plan.md#notes) at the end.
- Write the PR description with the developer reinstall note.
