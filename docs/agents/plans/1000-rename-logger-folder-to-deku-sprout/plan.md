# Plan: Rename logger/ folder to deku-sprout/

Issue: [1000-rename-logger-folder-to-deku-sprout.md](../../issues/1000-rename-logger-folder-to-deku-sprout.md)

## Overview

Rename the top-level `logger/` folder to `deku-sprout/` (the npm package it holds) and update every path reference to it in one rename-only PR. That covers package links and lockfiles, docker-compose mounts and Dockerfile `COPY`s, `/home/node/` container paths, `release.yml`, CircleCI, scripts, docs, and agent definitions. It also renames the `logger` agent and `docs/agents/logger.md` to `deku-sprout`. No code under `lib/` changes and no version is bumped, because the release checks can't see across the rename (see the issue's Edge cases). Class and concept names (`Logger`, `ConsoleLogger`, `Logger.setLogger(logger)`, log levels, …) are untouched. Only path references change.

## Agents involved

- [logger](logger.md): moves the folder (goes first)
- [engine](engine.md): `source/` package link and lockfile
- [dev](dev.md): `dev/app` package link and lockfile
- [docker](docker.md): compose mounts and Dockerfile `COPY`s
- [docs](docs.md): root `README.md`

The coordinator (architect) handles root-level files, `scripts/`, CI, `docs/agents/` and `.claude/agents/` (see [Coordinator steps](#coordinator-steps)). It renames the `logger` agent **last**.

## Shared contracts

| What | Old | New |
|---|---|---|
| Folder | `logger/` | `deku-sprout/` |
| `file:` link (from `source/` and `dev/app/`) | `"deku-sprout": "file:../logger"` | `"deku-sprout": "file:../deku-sprout"` |
| Container path (compose mount and Dockerfile `COPY` target) | `/home/node/logger` | `/home/node/deku-sprout` |
| Bare-CI copy for `dev/app` (`scripts/ci/setup-dev.sh`, `.gitignore`) | `dev/logger` | `dev/deku-sprout` |
| `release.yml` `deku-sprout.folder` | `logger` | `deku-sprout` |
| CircleCI `path:` of `jasmine-deku-sprout` / `checks-deku-sprout` | `logger` | `deku-sprout` (job names unchanged) |
| Agent | `logger` (`.claude/agents/logger.md`) | `deku-sprout` (`.claude/agents/deku-sprout.md`) |
| Agent doc | `docs/agents/logger.md` | `docs/agents/deku-sprout.md` |

Unchanged: the npm name `deku-sprout`, its version `0.3.0`, the `sprout-` tag prefix, the CircleCI job names, the `bump_version.sh` target `deku-sprout`, and the `Lib (Deku Sprout)` README row.

**Order inside the PR:**

1. logger: `git mv` the folder.
2. engine and dev: they regenerate their lockfiles against the moved folder.
3. docker, docs and the coordinator path updates (in any order).
4. Coordinator: renames the agent and its doc, then runs the verification.

## Coordinator steps

### Step C1: Root files, scripts and CI

- `release.yml:12`: `folder: logger` → `folder: deku-sprout`.
- `.circleci/config.yml:298,300,307,309`: `path: logger` → `path: deku-sprout`.
- `.gitignore:156`: `dev/logger` → `dev/deku-sprout`.
- `scripts/ci/setup-dev.sh:8-12`: the comment and the `rm -rf dev/logger` / `cp -r logger dev/logger` commands → `dev/deku-sprout` / `cp -r deku-sprout dev/deku-sprout`. The `file:../deku-sprout` link from `dev/app` resolves to `dev/deku-sprout` on a bare CI checkout.
- `scripts/bump_version.sh:21,25`: `$ROOT_DIR/logger/...` → `$ROOT_DIR/deku-sprout/...`. Keep the `LOGGER_*` variable names. The `deku-sprout` target and usage text are unchanged.
- `scripts/ci/pin-local-deps.sh:7`: `./logger/package.json` → `./deku-sprout/package.json`. Check that its `file:` rewrite still matches the new link value.
- `scripts/lib/package_bump_check.sh:3`: comment `logger/ -> deku-sprout` → `deku-sprout/ -> deku-sprout`.
- `scripts/release/spec/git_spec.js:70,73,78,81,89,95`: fixture folder `'logger'` → `'deku-sprout'` (and the matching `show base:deku-sprout/package.json` keys).
- `scripts/release/spec/validateReleaseTree_spec.js:27,166`: `'file:../logger'` → `'file:../deku-sprout'`. Leave every `worker` part alone; it belongs to #1001.

### Step C2: Agent-facing docs, agents, and the final agent rename

- `AGENTS.md:21`: the link becomes `docs/agents/deku-sprout.md`, the title becomes "Deku Sprout Subsystem" (or keep "Logger Subsystem"; either is fine), and `` (`logger/`) `` → `` (`deku-sprout/`) ``.
- `docs/agents/folder-structure.md:12`: row `logger/` → `deku-sprout/`, owner `deku-sprout`, `file:../deku-sprout`.
- `docs/agents/architecture/source-layout.md:10`: tree entry `logger/` → `deku-sprout/` and the doc link.
- `docs/agents/client-node.md:42,69`: `file:../logger` → `file:../deku-sprout`, and `` `logger/` `` → `` `deku-sprout/` ``. Keep the `[Logger Subsystem](logger.md)` link working (→ `deku-sprout.md`).
- `docs/agents/release.md:14,26,52,95` and `docs/agents/release-token.md:9`: `logger/` paths → `deku-sprout/`.
- `git mv docs/agents/logger.md docs/agents/deku-sprout.md`, then update its path references (lines 5, 7, 8, 15, 16, 19, 23, 34, 38, 46, 58, 77–82): `logger/…` → `deku-sprout/…`, `file:../logger` → `file:../deku-sprout`, `/home/node/logger` → `/home/node/deku-sprout`, the owner `logger` agent → `deku-sprout`. Keep the `worker/` mentions; they belong to #1001.
- `.claude/agents/{dev,docs,engine,frontend,guide,navi-client,spec-support,worker}.md`: `logger/` → `deku-sprout/`. Where they name the owning agent (`owned by \`logger\``, the `(…, worker, logger)` list in `docs.md`), → `deku-sprout`. `docs.md`'s description and line 22 change `logger/README.md` → `deku-sprout/README.md`.
- **Last**: `git mv .claude/agents/logger.md .claude/agents/deku-sprout.md`. Set `name: deku-sprout`, update the description and body (`logger/` → `deku-sprout/`, "logger specialist" → "deku-sprout specialist"), and update `.claude/agents/architect.md:28` (roster row `` `logger` `` → `` `deku-sprout` ``) and `:54` (doc link and path).

### Step C3: Verification

- `git grep -nE "(^|[^a-zA-Z_-])logger/|\.\./logger([^a-zA-Z_-]|$)|\./logger([^a-zA-Z_-]|$)|/home/node/logger|folder: '?logger|path: logger|dev/logger" -- . ':!docs/agents/issues/' ':!docs/agents/plans/'` returns nothing.
- `git grep -n 'logger\.md'` only returns the agent-doc links that intentionally point elsewhere (none expected).
- `scripts/release` specs and lint pass: `cd scripts/release && yarn test && yarn lint` (CI jobs `jasmine-release` / `checks-release`).
- `DRY_RUN=1 scripts/ci/release-npm-package.sh deku-sprout` reports nothing to publish (`0.3.0` is already on npm) and the bump check passes.
- `scripts/ci.sh validate-release-yml` passes.
- The PR description tells developers to reinstall dependencies or wipe `docker_volumes/node_modules*`, whose `deku-sprout` symlinks point at the old folder.

## CI Checks

- `deku-sprout/`: `yarn test`, `yarn lint` (CI jobs `jasmine-deku-sprout`, `checks-deku-sprout`)
- `source/`: `yarn test`, `yarn lint` (CI jobs `jasmine`, `checks`)
- `dev/app`: via `scripts/ci/setup-dev.sh` (CI jobs `jasmine-dev`, `checks-dev`)
- `scripts/release/`: `yarn test`, `yarn lint` (CI jobs `jasmine-release`, `checks-release`)
- Repo-wide: `validate-release-yml`, `cascade-bump-check`

## Notes

- **Rename-only:** no change under `deku-sprout/lib/` and no version bump. Otherwise the forgotten-bump and cascade checks, which are blind across the rename, would wave it through.
- Ignore the untracked `*.orig` files (e.g. `docs/agents/logger.md.orig`).
- Historical files under `docs/agents/issues/` and `docs/agents/plans/` are records, so they are not rewritten.
- `worker/` references stay untouched. That's #1001, which follows the pattern set here.
