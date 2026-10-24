# Rename the worker agent (last)

The `worker` agent is one of the agents doing this PR's work, so rename it only after every other step is done.

- `git mv .claude/agents/worker.md .claude/agents/deku-swarm.md`.
- Frontmatter: `name: worker` becomes `name: deku-swarm`. The description changes to "Navi deku-swarm specialist. Use for any task involving deku-swarm/ — the deku-swarm package: …".
- Body: "worker specialist" becomes "deku-swarm specialist". `worker/` and `worker/README.md` become `deku-swarm/` and `deku-swarm/README.md`. `scripts/bump_version.sh worker [version]` becomes `scripts/bump_version.sh deku-swarm [version]`. The link to `docs/agents/worker.md` becomes `docs/agents/deku-swarm.md`.
- Run the final acceptance grep from [plan.md](../plan.md#notes).

## Files to Change
- `.claude/agents/worker.md` → `.claude/agents/deku-swarm.md`
