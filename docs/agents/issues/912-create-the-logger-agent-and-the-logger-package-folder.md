# Issue: Create the logger agent and the logger/ package folder

## Description
Part 2 of 7 of #888 (extract the shared logging code into the `deku-sprout` package). Create the owner of the new package and the folder it will live in, so the following sub-issues have an agent to delegate to and a place to work in.

## Solution
- Add the `logger` agent (`.claude/agents/logger.md`), mirroring `.claude/agents/worker.md`:
  - scope is everything inside `logger/` (the `deku-sprout` package: `lib/`, `spec/`, `package.json`, eslint config);
  - the npm-facing `logger/README.md` is owned by the `docs` agent, like `worker/README.md`;
  - it must not touch `source/`, `clients/node/`, `dev/`, `frontend/` or `worker/`.
- Register the agent wherever the roster is listed:
  - the specialist table in `.claude/agents/architect.md`;
  - the folder table in `docs/agents/folder-structure.md`;
  - the `docs` agent's scope list (`logger/README.md`) and the "Do NOT touch" lines of the agents that already carry one (add `logger/`);
  - any other roster/delegation doc found while implementing.
- Create the `logger/` folder at the repo root, next to `worker/`. Git does not track empty folders, so it is kept with a `logger/.gitkeep` (the repo already uses this convention), to be removed when the package is scaffolded in the next sub-issue.
- The agent file links to the design specs (`docs/agents/specs/deku-sprout.md`) for now; the permanent `docs/agents/logger.md` and the AGENTS.md doc-table entries land with the scaffold/extraction sub-issues, not here.

## Benefits
- The following sub-issues have an owner and a place to work in
