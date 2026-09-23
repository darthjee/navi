# Fix the other stale references and index entries

- `docs/agents/architecture/source-layout.md:10`: change the `logger/` tree comment "(empty until scaffolded, see docs/agents/specs/deku-sprout.md)" to a present-tense description that links to `docs/agents/logger.md`.
- `docs/agents/client-node.md` (tree around lines 15–18): it still lists a `lib/logging/` folder ("self-contained port of source/lib/common/utils/logging/"), but `clients/node/lib/logging/` no longer exists (#916 removed it). Remove those tree lines. The prose at line 46 already describes the `deku-sprout` dependency correctly.
- Documentation indexes: add a "Logger Subsystem" row for `docs/agents/logger.md`, next to the "Worker Subsystem" row, in:
  - `AGENTS.md`, in the docs table
  - `.claude/agents/architect.md`, in the docs table
  - Use a matching description, for example: "Class-by-class reference for `deku-sprout` (`logger/`), the shared logging package — `BaseLogger`, `ConsoleLogger`, `LoggerGroup`, `Logger` — its consumers and its release flow."

## Files to Change
- `docs/agents/architecture/source-layout.md`: fix the `logger/` tree comment
- `docs/agents/client-node.md`: remove the stale `lib/logging/` tree entries
- `AGENTS.md`: add the Logger Subsystem row to the docs table
- `.claude/agents/architect.md`: add the Logger Subsystem row to the docs table
