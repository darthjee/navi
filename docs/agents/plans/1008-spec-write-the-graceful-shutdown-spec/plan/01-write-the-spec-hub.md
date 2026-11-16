# Write the spec hub
Create `docs/agents/specs/engine-shutdown.md`, modelled on `docs/agents/specs/crawler.md`:

- Title, e.g. `# Feature: Engine Graceful Shutdown`.
- One intro paragraph: what `await engine.shutdown({ timeoutMs })` → `true | false` will do (an awaitable drain of in-flight jobs, bounded by a timeout, that lets `start()` resolve), why it is needed (today `stop()` only sets a flag and `keepAlive: true` never exits on its own, so hosts like darthjee/kerghan#479 hand-roll a poll-then-stop), and a link to Epic #1004 and its sub-issues #1009–#1011.
- A note that this is a temporary spec, removed by #1011 once the work is folded into permanent docs.
- A `| Topic | Description |` table linking the eight topic files from step 02 (`engine-shutdown/semantics.md`, `loop-exit.md`, `edge-cases.md`, `idle-hook.md`, `testing.md`, `out-of-scope.md`, `versioning.md`, `open-questions.md`).

## Files to Change
- `docs/agents/specs/engine-shutdown.md` — new spec hub.
