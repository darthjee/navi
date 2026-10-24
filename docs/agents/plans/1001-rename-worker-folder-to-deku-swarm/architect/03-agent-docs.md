# Agent docs and cross-references

Rename the agent doc and update the internal docs and other agents' definitions to use the new path. Leave the `worker` agent file itself for step 04.

- `git mv docs/agents/worker.md docs/agents/deku-swarm.md`. Inside it, change every `worker/lib/...` path to `deku-swarm/lib/...`, and the self-link `../../worker/lib/README.md` to `../../deku-swarm/lib/README.md`. Class names and the "worker subsystem" concept stay.
- `AGENTS.md`: the doc-index row (`docs/agents/worker.md` → `docs/agents/deku-swarm.md`, `worker/` → `deku-swarm/`) and the `worker/lib/` README-map row.
- `docs/agents/folder-structure.md`, `docs/agents/architecture/source-layout.md` (tree entry), `docs/agents/architecture/testing.md`, `docs/agents/flow/engine-and-workers.md` (link `../worker.md` → `../deku-swarm.md`), `docs/agents/release.md` (the `deku-swarm` folder row, `swarm-<worker/package.json version>`, bump-target lists and examples), `docs/agents/release-token.md`, `docs/agents/client-node.md` (bump-target list), `docs/agents/deku-sprout.md` ("same tooling as `worker/`").
- `.claude/agents/architect.md` (roster row: agent `deku-swarm`, scope `deku-swarm/`), `docs.md`, `engine.md`, `guide.md`, `deku-sprout.md` ("Do NOT touch … `worker/`" lists and README-ownership references) all switch to `deku-swarm/`.
- Search `docs/agents/plans/` for open plans that link to `docs/agents/worker.md` or dispatch the `worker` agent, and update them. This plan itself is exempt.

## Files to Change
- `docs/agents/worker.md` → `docs/agents/deku-swarm.md`
- `AGENTS.md`
- `docs/agents/folder-structure.md`, `docs/agents/architecture/source-layout.md`, `docs/agents/architecture/testing.md`, `docs/agents/flow/engine-and-workers.md`, `docs/agents/release.md`, `docs/agents/release-token.md`, `docs/agents/client-node.md`, `docs/agents/deku-sprout.md`
- `.claude/agents/architect.md`, `.claude/agents/docs.md`, `.claude/agents/engine.md`, `.claude/agents/guide.md`, `.claude/agents/deku-sprout.md`
