# Update agent docs

Keep the agent docs in sync with the new field and line:

- `docs/agents/flow/failure-handling.md`: next to the existing sentence about the `Unresolved: N` line, add that not-yet-attempted or not-yet-completed jobs (`enqueued + processing`) are shown on a `Pending: N` line when N > 0, also outside the ratio and exit decision.
- `docs/agents/deku-swarm.md`, auxiliary-services table: in the `LifetimeJobStats` row, list `pending` among the counts (`total`/`dead`/`unresolved`/`pending`). In the `RunSummary` row, mention the optional `Pending: N` line next to `Unresolved: N`.

## Files to Change

- `docs/agents/flow/failure-handling.md` — mention the `Pending` line.
- `docs/agents/deku-swarm.md` — `LifetimeJobStats` and `RunSummary` rows.
