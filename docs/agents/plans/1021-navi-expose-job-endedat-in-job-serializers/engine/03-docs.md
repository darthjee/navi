# Document endedAt in web-server.md

Add an `endedAt` row to both job serializer tables in `docs/agents/web-server.md`:

- **`JobIndexSerializer`** table: `| \`endedAt\` | string \| null | ISO 8601 time the job reached a terminal state (finished/dead); \`null\` otherwise. |`. While there, add the missing optional `url` row (`string`, present for `ResourceRequestJob` or jobs with an `originUrl` argument) so the table matches the code.
- **`JobShowSerializer`** table: `| \`endedAt\` | string \| null | all | ISO 8601 end time; \`null\` unless the job has ended (cleared again when a dead job is retried). |`.

## Files to Change

- `docs/agents/web-server.md` — `endedAt` rows (and the missing `url` row) in the job serializer tables.
