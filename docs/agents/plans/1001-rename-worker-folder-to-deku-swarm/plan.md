# Plan: Rename worker/ folder to deku-swarm/

Issue: [1001-rename-worker-folder-to-deku-swarm.md](../../issues/1001-rename-worker-folder-to-deku-swarm.md)

## Overview

Rename the top-level `worker/` folder to `deku-swarm/` with `git mv`, then update every **path** reference to it. That covers package links and lockfiles, Docker mounts and `COPY` targets, `release.yml`, CircleCI, scripts, docs and agent definitions. The CircleCI jobs, the `bump_version.sh` target, the agent and its doc are renamed to `deku-swarm` too. Like #1002 (`logger/` → `deku-sprout/`), this is a rename-only PR: nothing under `lib/` changes and the version isn't bumped.

## Agents involved

Order of work:

1. [worker](worker.md): `git mv worker deku-swarm` (everyone else builds on this).
2. In parallel: [docker](docker.md), [docs](docs.md), [architect](architect.md) (steps 01–03).
3. [engine](engine.md): switch the `file:` link and regenerate the lockfiles. This needs the new docker mounts.
4. [architect](architect.md) step 04: rename the `worker` agent to `deku-swarm`, as the **last** step of the PR.

## Shared contracts

| Item | Old | New |
|------|-----|-----|
| Folder | `worker/` | `deku-swarm/` |
| npm package name | `deku-swarm` | `deku-swarm` (unchanged) |
| `file:` link in `source/package.json` | `"deku-swarm": "file:../worker"` | `"deku-swarm": "file:../deku-swarm"` |
| Container path | `/home/node/worker` | `/home/node/deku-swarm` |
| Compose mount | `./worker:/home/node/worker` | `./deku-swarm:/home/node/deku-swarm` |
| Dockerfile `COPY` | `./worker/ /home/node/worker/` | `./deku-swarm/ /home/node/deku-swarm/` |
| `release.yml` | `folder: worker` | `folder: deku-swarm` |
| CircleCI jobs | `jasmine-worker`, `checks-worker` | `jasmine-deku-swarm`, `checks-deku-swarm` |
| `bump_version.sh` target | `worker` | `deku-swarm` (usage: `[app\|all\|client\|deku-swarm\|deku-sprout]`) |
| Agent | `worker` (`.claude/agents/worker.md`) | `deku-swarm` (`.claude/agents/deku-swarm.md`) |
| Agent doc | `docs/agents/worker.md` | `docs/agents/deku-swarm.md` |

Do not change:

- Class and concept names (`Worker`, `WorkersAllocator`, `workersConfig`, the worker/web/log config sections, "per-worker" log buffers).
- The README Versions-table row label `Worker (Deku Swarm)`. It is display text, and `bump_version.sh`'s `update_readme_row` matches on it.
- Release tags (`swarm-` prefix).

**No blind find-and-replace on `worker`.**

## Notes

- Rename-only: no edits under `deku-swarm/lib/` (code) and no `deku-swarm` version bump. The forgotten-bump and cascade checks can't compare across the rename (see the issue's Edge case 1).
- PR description must include an **Action needed by developers** note: `docker_volumes/node_modules*` (and any local `node_modules`) hold a `deku-swarm` symlink to the old `worker/` folder. Reinstall dependencies, or wipe those volumes.
- Final acceptance grep (tracked files, excluding `docs/agents/issues/` and `docs/agents/plans/`): `git grep -nE '(^|[^a-zA-Z-])worker/|\.\./worker|\./worker|/home/node/worker|folder: worker|path: worker|jasmine-worker|checks-worker'` returns nothing.
