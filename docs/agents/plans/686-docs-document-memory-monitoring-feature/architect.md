# architect Plan: Docs: document memory monitoring feature

Main plan: [plan.md](plan.md)

## Shared contracts

- Depends on `docs`'s step 3 ([docs/03-rename-how-to-use-navi.md](docs/03-rename-how-to-use-navi.md)) landing first: the exact new path is `docs/guides/how_to_use_navi.md`.

## Implementation Steps

### Step 1 — Update the two agent-roster references to the renamed guide

These two files are outside `docs`'s own scope (they're the agent-roster/definition files, owned by `architect`), so update them here rather than as part of `docs`'s rename step:

- `.claude/agents/architect.md` — the agent roster table's `docs` row lists `docs/guides/HOW_TO_USE_NAVI.md` among the paths that agent owns; update it to `docs/guides/how_to_use_navi.md`.
- `.claude/agents/docs.md` — updates three separate references to the old filename: the frontmatter `description` line, the bullet describing it as "the integration/index guide for developers and AI agents", and the example sentence about keeping examples consistent across `README.md`/`docs/guides/HOW_TO_USE_NAVI.md`/`docs/guides/navi/*.md`.

## Files to Change

- `.claude/agents/architect.md` — update the `docs` agent's scope description to the renamed path.
- `.claude/agents/docs.md` — update all references to the renamed path (frontmatter `description`, scope bullet, consistency-example sentence).

## Notes

- Purely a path-string update — the guide's ownership and content are unaffected.
