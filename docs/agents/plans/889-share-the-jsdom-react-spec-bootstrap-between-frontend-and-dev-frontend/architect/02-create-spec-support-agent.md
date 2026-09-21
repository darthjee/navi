# Create the spec-support agent and update agent scopes
Add a dedicated agent that owns `spec-support/`, following the one-agent-per-package convention (`worker`, `navi-client`), and narrow the neighbouring agents' scopes.

- New `.claude/agents/spec-support.md`, modelled on `.claude/agents/worker.md`: front-matter (`name: spec-support`, description, `tools: Read, Edit, Write, Bash`), scope (everything inside `spec-support/`), stack (Node ESM, Yarn, peer dependencies only, no runtime deps), the "reinstall in each consumer after editing" rule, the `exports` contract and the compose mounts, and what it must not touch (`frontend/`, `dev/`, `dockerfiles/`, `docker-compose.yml`).
- `.claude/agents/frontend.md`: note that the shared jsdom/React bootstrap lives in `spec-support/` and is consumed, not owned, by `frontend/`.
- `.claude/agents/dev.md`: same for `dev/frontend/`.
- `.claude/agents/docker.md`: mention the new compose mounts and the `navi-hey-test` reference to `spec-support/`.

## Files to Change
- `.claude/agents/spec-support.md` — new agent definition
- `.claude/agents/frontend.md` — scope note
- `.claude/agents/dev.md` — scope note
- `.claude/agents/docker.md` — scope note
