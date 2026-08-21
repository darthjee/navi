# docs Plan: Move worker to a separated package

Main plan: [plan.md](plan.md)

## Shared contracts

- Reads `worker/package.json`'s `version` field (produced by `engine`, starting at `1.6.2`) for the initial badge values — same field `architect`'s `scripts/bump_version.sh worker` keeps in sync afterward.

## Implementation Steps

### Step 1 — Add Worker version badges to README.md

Add `**Worker Current Version:**` / `**Worker Next Version:**` badges to `README.md`, matching the exact bold-markdown format and placement convention the existing `**Client Current Version:**` / `**Client Next Version:**` badges use (not the plain-text format from the original issue draft — `scripts/check_worker_tag_version.sh`, added by `architect`, greps for the bold form specifically).

```markdown
**Worker Current Version:** [1.6.2](https://github.com/darthjee/navi/releases/tag/worker-1.6.2)

**Worker Next Version:** [1.6.3](https://github.com/darthjee/navi/compare/worker-1.6.2...main)
```

Place them immediately after the existing Client badges, so all three packages' version badges read as one consistent block.

## Files to Change

- `README.md` — add the two Worker version badge lines.

## Notes

- `worker/README.md` (the npm-facing readme, mirroring `clients/node/README.md`) ownership was flagged in `architect/03-establish-worker-agent-and-trim-engine.md` — if it's assigned to `docs` (matching the `clients/node/README.md` precedent), write a real one here too instead of leaving `engine`'s short placeholder from `engine/02-create-worker-package-skeleton.md` in place.
