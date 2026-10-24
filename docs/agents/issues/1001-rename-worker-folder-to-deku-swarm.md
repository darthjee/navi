# Issue: Rename worker/ folder to deku-swarm/

## Description

Part of #999. The top-level folder `worker/` holds the published npm package `deku-swarm` (a generic queue-and-pool worker system: `Worker`, `Job`, the registries, `Engine`, `WorkersAllocator`, …), but its name doesn't say so. Rename `worker/` to `deku-swarm/` and update every reference to it, so the folder matches its package.

**Unblocked.** The other sub-issue of #999, the `logger/` → `deku-sprout/` rename (#1000), was merged in #1002. Both renames edit the same files (`release.yml`, `.circleci/config.yml`, `docker-compose.yml`, `scripts/bump_version.sh`, `AGENTS.md`, `docs/agents/folder-structure.md`), so this one had to wait for it. Follow the naming pattern that rename set:

- container path `/home/node/<package>`
- agent doc `docs/agents/<package>.md`
- an agent named after the package

## Problem

The `deku-swarm` package lives in a folder named `worker/`. Now that `deku-sprout/` matches its package name, `worker/` is the only package folder that doesn't. That makes path references, agent ownership and release config harder to follow.

## Expected Behavior

- CI is green, including the renamed `*-deku-swarm` jobs, `validate-release-yml` and `cascade-bump-check`.
- `docker compose` services start and install `deku-swarm` from the new path.
- `DRY_RUN=1 scripts/ci/release-npm-package.sh deku-swarm` publishes nothing.
- `scripts/bump_version.sh deku-swarm <version>` works (dry check, no commit).
- No reference to the old folder path is left in tracked files (grep for `worker/`, `../worker`, `./worker`, `/home/node/worker`, `folder: worker`, `path: worker`), apart from the concept names allowed under Scope.

## Solution

`git mv worker deku-swarm`, then update every path reference to it.

### Touch points

References to the `worker/` folder found in tracked files (outside the folder itself). This list was re-checked against `main` after #1002 was merged. The extra files #1002 had to touch (`scripts/ci/setup-dev.sh`, `.gitignore`, `scripts/release/spec/git_spec.js`, `dev/app`) don't reference `worker/`.

- **Package links and lockfiles**: `source/package.json` (`"deku-swarm": "file:../worker"`), `source/yarn.lock`, `source/package-lock.json`.
- **Docker**: `docker-compose.yml` (`./worker:/home/node/worker` mounts), `dockerfiles/navi-hey-test/Dockerfile` (`COPY ./worker/ /home/node/worker/`).
- **Release**: `release.yml` (`deku-swarm.folder: worker`).
- **CircleCI**: `.circleci/config.yml`. Rename the jobs `jasmine-worker` / `checks-worker` to `jasmine-deku-swarm` / `checks-deku-swarm` (matching `*-deku-sprout`) and update every `requires:` list that names them. Also update their `path: worker` entries.
- **Scripts**: `scripts/bump_version.sh` (`WORKER_README`, `WORKER_PACKAGE_JSON`, and the `worker` target, see Edge cases), `scripts/ci/pin-local-deps.sh`, `scripts/lib/package_bump_check.sh` (header comment), `scripts/release/spec/validateReleaseTree_spec.js` (fixtures).
- **Docs**: `README.md`, `AGENTS.md`, `docs/agents/folder-structure.md`, `docs/agents/release.md`, `docs/agents/release-token.md`, `docs/agents/client-node.md`, `docs/agents/architecture/source-layout.md`, `docs/agents/architecture/testing.md`, `docs/agents/flow/engine-and-workers.md`, `docs/agents/worker.md`, `docs/agents/deku-sprout.md`, `docs/guides/deku-swarm/collections.md`, the package's own `README.md` and `lib/README.md` (they move with the folder).
- **User-facing guide**: `docs/guides/navi/option-e-development-image.md` tells users to mount `-v $(pwd)/worker:/home/node/worker`. Update it to the new path.
- **Agents**: every `.claude/agents/*.md` that mentions `worker/` (architect, docs, engine, guide, deku-sprout, worker).

### Agent and doc renames

- Rename the `worker` agent (`.claude/agents/worker.md`) to `deku-swarm` (file name and `name:` frontmatter), with its scope pointing at `deku-swarm/`.
- Rename `docs/agents/worker.md` to `docs/agents/deku-swarm.md`.
- Update everything that dispatches or links to them: `AGENTS.md`, the architect agent, other agents' cross-references, and any open plans in `docs/agents/plans/`.
- Since the `worker` agent is one of the agents doing the work, the architect renames it as the **last step** of the PR.

### Scope

**In scope**: the folder rename and every reference to the folder path in tracked files (listed above), the container path `/home/node/worker` → `/home/node/deku-swarm`, the CircleCI job names, the `bump_version.sh` target, the agent and doc renames, and prose that calls it "the worker package" when it means the folder (reword it to use `deku-swarm`).

The `file:../deku-swarm` link resolves relative to `/home/node/source` inside the containers. That's why the compose mounts and the Dockerfile `COPY` targets have to follow the rename.

**Out of scope**

- The npm package name `deku-swarm` (unchanged).
- Class and concept names (`Worker`, `WorkersAllocator`, `workersConfig`, the "worker/web/log" config sections in `source/lib/services/config/ConfigLoader.js`, "per-worker" log buffers, generic uses of "worker" in the engine). Only path references (`worker/`, `../worker`, `./worker`, `/home/node/worker`, `folder: worker`, `path: worker`) change. **Do not use a blind find-and-replace on `worker`.**
- Git history and release tags (they use the `swarm-` prefix, not folder names).
- Making the release checks rename-aware.

### Edge cases

1. **Rename-only PR.** The forgotten-bump check (`scripts/lib/package_bump_check.sh`) and the cascade check (`scripts/release/bin/check-cascade-bumps.js`) look up the package at an older ref under the *new* folder name, which doesn't exist there yet. The bump check then reports "bumped (none → X.Y.Z)" and passes no matter what changed. The cascade check treats the base as missing and requires nothing. So this PR **must not change code under `lib/` and must not bump the `deku-swarm` version.** That way the checks have nothing to miss, and `release-npm-package.sh` publishes nothing. #1002 used the same approach for `deku-sprout`.
2. **`bump_version.sh` target**: the targets are currently `worker` and `deku-sprout`, which is inconsistent. Rename the `worker` target to `deku-swarm`: the usage text, `TARGETS_REGEX`, the case branches (`bump_worker` etc.), and every doc that shows the command.
3. **Lockfiles**: regenerate them by running the install inside the containers. Don't edit them by hand.
4. **Stale local state**: `docker_volumes/node_modules*` contain `deku-swarm` symlinks that point to the old folder. The PR description must tell developers to reinstall dependencies (or wipe those volumes), as #1002 did for `deku-sprout`.

### Responsible agents

The **architect** coordinates. The `docker` agent handles compose and Dockerfiles, `docs` the READMEs and guides, and the `worker` agent its own folder. The architect renames the `worker` agent last.
