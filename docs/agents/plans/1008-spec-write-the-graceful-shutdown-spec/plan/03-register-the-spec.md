# Register the spec in specs.md
Add a row to the `## Specs` table in `docs/agents/specs.md`, linking only the hub (never the subfiles), after the existing Crawler row:

```markdown
| [Engine Graceful Shutdown](specs/engine-shutdown.md) | `deku-swarm` `Engine.shutdown({ timeoutMs })`: awaitable drain of in-flight jobs (Epic #1004). |
```

Leave the intro and conventions untouched.

## Files to Change
- `docs/agents/specs.md` — add the spec's table row.
