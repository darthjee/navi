# Issue: Rename logger/ folder to deku-sprout/

## Description

Part of #999. The top-level folder `logger/` holds the published npm package `deku-sprout` (the shared logging classes `BaseLogger`, `ConsoleLogger`, `LoggerGroup`, `Logger`), but its name doesn't say so. Rename `logger/` to `deku-sprout/` and update every reference to it, so the folder matches its package.

This is the first of two renames (the second is `worker/` → `deku-swarm/`). It goes first because it is the smaller one, and it **sets the naming pattern** the second one follows:

- container path `/home/node/<package>`
- agent doc `docs/agents/<package>.md`
- an agent named after the package

## Problem

The folder name `logger/` describes a role, not the package it holds. Its own README, `release.yml`, the CI job names (`*-deku-sprout`) and the release tags (`sprout-`) already call it `deku-sprout`. The folder is the odd one out, so readers have to know the mapping `logger/` → `deku-sprout`.

## Expected Behavior

- CI is green, including `validate-release-yml` and `cascade-bump-check`.
- `docker compose` services start and install `deku-sprout` from the new path.
- `DRY_RUN=1 scripts/ci/release-npm-package.sh deku-sprout` publishes nothing.
- No reference to the old folder path is left in tracked files (grep for `logger/`, `../logger`, `./logger`, `/home/node/logger`, `folder: logger`, `path: logger`), apart from the concept names allowed under Scope.

## Solution

### Touch points

References to the `logger/` folder found in tracked files (outside the folder itself):

- **Package links and lockfiles**: `source/package.json` and `dev/app/package.json` (`"deku-sprout": "file:../logger"`), `source/yarn.lock`, `dev/app/yarn.lock` (and `source/package-lock.json` if it has an entry).
- **Docker**: `docker-compose.yml` (`./logger:/home/node/logger` mounts, 3 services), `dockerfiles/demo_dev_app/Dockerfile`, `dockerfiles/navi-hey-test/Dockerfile` (`COPY ./logger/ /home/node/logger/`).
- **Release**: `release.yml` (`deku-sprout.folder: logger`).
- **CircleCI**: `.circleci/config.yml`, the `path: logger` entries of the `jasmine-deku-sprout` / `checks-deku-sprout` jobs (the job names are already correct).
- **Scripts**: `scripts/bump_version.sh` (`LOGGER_README`, `LOGGER_PACKAGE_JSON`), `scripts/ci/pin-local-deps.sh`, `scripts/ci/setup-dev.sh` (comment), `scripts/lib/package_bump_check.sh` (header comment), `scripts/release/spec/git_spec.js` and `scripts/release/spec/validateReleaseTree_spec.js` (fixtures using `folder: 'logger'`).
- **Docs**: `README.md`, `AGENTS.md`, `docs/agents/folder-structure.md`, `docs/agents/release.md`, `docs/agents/release-token.md`, `docs/agents/client-node.md`, `docs/agents/architecture/source-layout.md`, `docs/agents/logger.md`, and the package's own `README.md` (moves with the folder).
- **Agents**: every `.claude/agents/*.md` that mentions `logger/` (architect, dev, docs, engine, frontend, guide, logger, navi-client, spec-support, worker).

### Agent and doc renames

- Rename the `logger` agent (`.claude/agents/logger.md`) to `deku-sprout` (file name and `name:` frontmatter), with its scope pointing at `deku-sprout/`.
- Rename `docs/agents/logger.md` to `docs/agents/deku-sprout.md`.
- Update everything that dispatches or links to them: `AGENTS.md`, the architect agent, other agents' cross-references, and any open plans in `docs/agents/plans/`.
- Since the `logger` agent is one of the agents doing the work, the architect renames it as the **last step** of the PR.

### Scope

**In scope**: the folder rename and every reference to the folder path in tracked files (listed above), the container path `/home/node/logger` → `/home/node/deku-sprout`, the agent and doc renames, and prose that calls the package "the logger" when it means the folder (reword it to use `deku-sprout`).

The `file:../deku-sprout` link resolves relative to `/home/node/source` inside the containers. That's why the compose mounts and the Dockerfile `COPY` targets have to follow the rename.

**Out of scope**

- The npm package name `deku-sprout` (unchanged).
- Class and concept names (`Logger`, `ConsoleLogger`, `LoggerGroup`, the `log` config section, log levels, …). Only path references (`logger/`, `../logger`, `./logger`, `/home/node/logger`, `folder: logger`, `path: logger`) change. **Do not use a blind find-and-replace on `logger`.**
- The `worker/` folder (separate sub-issue).
- Git history and release tags (they use the `sprout-` prefix, not folder names).
- Making the release checks rename-aware.

### Edge cases

1. **Rename-only PR.** The forgotten-bump check (`scripts/lib/package_bump_check.sh`) and the cascade check (`scripts/release/bin/check-cascade-bumps.js`) look up the package at an older ref under the *new* folder name, which doesn't exist there yet. The bump check then reports "bumped (none → X.Y.Z)" and passes no matter what changed. The cascade check treats the base as missing and requires nothing. So this PR **must not change code under `lib/` and must not bump the `deku-sprout` version.** That way the checks have nothing to miss, and `release-npm-package.sh` publishes nothing (the version is already on npm).
2. **Lockfiles**: regenerate them by running the install inside the containers. Don't edit them by hand.
3. **Stale local state**: `docker_volumes/node_modules*` contain `deku-sprout` symlinks that point to the old folder. The PR description must tell developers to reinstall dependencies (or wipe those volumes).

### Responsible agents

The **architect** coordinates. The `docker` agent handles compose and Dockerfiles, `docs` the READMEs and guides, and the `logger` agent its own folder. The architect renames the `logger` agent last.

## Benefits

- The folder name matches the npm package, `release.yml` key, CI jobs and tag prefix.
- Sets the naming pattern (`/home/node/<package>`, `docs/agents/<package>.md`, agent named after the package) that the `worker/` → `deku-swarm/` rename follows.
