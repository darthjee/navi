# Plan: Create the logger agent and the logger/ package folder

Issue: [912-create-the-logger-agent-and-the-logger-package-folder.md](../../issues/912-create-the-logger-agent-and-the-logger-package-folder.md)

## Overview
Part 2 of 7 of #888. Add the `logger` specialist agent that will own the future `deku-sprout` package, register it wherever the agent roster and per-agent scope lists appear, and create the tracked, empty `logger/` folder at the repo root next to `worker/`. No package code is written here — that starts in the next sub-issue.

## Context
- All the touched files are `.claude/agents/*.md`, `docs/agents/*.md` and a `.gitkeep`: architect-owned, cross-cutting configuration/docs. No candidate specialist (`engine`, `worker`, `docs`, ...) owns any of them, so the plan is not split and the architect implements it.
- `.claude/agents/worker.md` is the model to mirror. `docs/agents/worker.md` and `docs/agents/logger.md` do not need to be mirrored yet: the permanent `logger.md` and the `AGENTS.md` doc-table rows land with the scaffold/extraction sub-issues (#913/#914). The agent file links to the specs `docs/agents/specs/deku-sprout.md` (from #911) for now.
- Git does not track empty folders; the repo already uses `.gitkeep` (e.g. `docs/agents/issues/.gitkeep`), so `logger/` is kept with `logger/.gitkeep`, removed by the scaffold sub-issue.
- Only agents that already carry a "Do NOT touch" line get `logger/` added to it (`dev`, `engine`, `frontend`, `guide`, `worker`, `navi-client`, `spec-support`); `docker.md` and `architect.md` have none.

## Implementation Steps

### Step 1 — Create the `logger` agent and the `logger/` folder
Write `.claude/agents/logger.md` mirroring `.claude/agents/worker.md`:
- Frontmatter: `name: logger`, a one-line `description` ("Navi logger specialist. Use for any task involving logger/ — the `deku-sprout` package: the shared logging classes (`BaseLogger`, `ConsoleLogger`, `LoggerGroup`, `Logger`) used by `source/`, `clients/node/` and `dev/app`."), `tools: Read, Edit, Write, Bash`.
- Scope: everything inside `logger/` (`lib/`, `spec/`, `package.json`, `eslint.config.mjs`); it has no domain knowledge of HTTP, caching or jobs; the Navi-specific logging classes (`Log`, `LogContext`, `LogFactory`, `LogFilter`, `buffer/`) stay in `source/`, owned by `engine`.
- `logger/README.md` (npm-facing readme) is owned by the `docs` agent, same convention as `worker/README.md` and `clients/node/README.md`.
- Out of scope: do NOT touch `source/`, `clients/node/`, `dev/`, `frontend/` or `worker/`.
- Stack / commands / conventions sections mirror `worker.md` (ES Modules, Yarn, Jasmine, c8, ESLint, JSCPD; `cd logger && yarn coverage && yarn lint && yarn report`; class-declarer files, `<ClassName>_spec.js`; independent versioning via `scripts/bump_version.sh`), phrased as the package's planned setup where the tooling does not exist yet, and linking to `docs/agents/specs/deku-sprout.md` instead of a not-yet-existing `docs/agents/logger.md`.

Create `logger/.gitkeep` (empty file) at the repo root, next to `worker/`.

### Step 2 — Register the agent in the roster and scope lists
- `.claude/agents/architect.md`: add a `logger` row to the specialist table, after `worker` (`logger/` — the `deku-sprout` npm package: the shared logging classes).
- `docs/agents/folder-structure.md`: add a `logger/` row after `worker/`.
- `.claude/agents/docs.md`: add `logger/README.md` (the npm-facing readme of `deku-sprout`) to the owned-files list, and `logger/lib` plus `logger` (agent) to the out-of-scope line.
- "Do NOT touch" lines: add `logger/` to `dev.md`, `engine.md`, `frontend.md`, `guide.md`, `worker.md`, `navi-client.md` and `spec-support.md`, each in the style of its existing sentence.
- `grep -rn "worker" AGENTS.md docs/agents/*.md docs/agents/architecture/*.md .claude/` once more for any other roster/delegation listing of the agents (e.g. under `docs/agents/contributing/`) and register `logger` there too if found.

## Files to Change
- `.claude/agents/logger.md` — new agent definition
- `logger/.gitkeep` — track the empty package folder
- `.claude/agents/architect.md` — roster row
- `docs/agents/folder-structure.md` — folder row
- `.claude/agents/docs.md` — owns `logger/README.md`; out-of-scope line mentions `logger`
- `.claude/agents/{dev,engine,frontend,guide,worker,navi-client,spec-support}.md` — add `logger/` to their "Do NOT touch" line

## Notes
- `.claude/agents/docs.md` does not currently list `worker/README.md` even though `worker.md` says `docs` owns it; not fixed here (out of scope), only `logger/README.md` is added.
- `AGENTS.md` doc-table entries, `docs/agents/logger.md` and the scaffold (`package.json`, eslint/jasmine config) are deliberately left to the following sub-issues.
- Nothing to run in CI: only markdown/agent config and an empty file change.
