# Write `overview.md` and `package.md`
Both files go in `docs/agents/specs/deku-sprout/`.

**`overview.md`** — why the package exists. The problem: `source/lib/common/utils/logging/` and `clients/node/lib/logging/` carry duplicated copies of `BaseLogger` (98 vs 103 lines, doc comment only), `ConsoleLogger` (20 vs 25 lines, doc comment only) and `Logger` (138 vs 115 lines: the engine's is group-aware through `LoggerGroup`, the client's wraps a single `ConsoleLogger`), with duplicated specs (`ConsoleLogger_spec.js` and `Logger_spec.js` in both places, flagged as clones by Codacy; repository duplication 18% against a 10% goal), and the two copies are kept in sync by hand. Goals: the shared logging code and its specs live in one place, consumed by `source/`, `clients/node/` and `dev/app`, with no change in logging behaviour. Non-goals: no change to the logging API or output, no move of the Navi-specific classes.

**`package.md`** — what the package is:
- `deku-sprout`: public, unscoped npm package, living in `logger/` at the repo root next to `worker/`, owned by the `logger` agent (to be created in #912), with its npm-facing `README.md` owned by `docs`.
- Shape mirrors `worker/package.json` (`deku-swarm`): ESM, `main: lib/index.js`, `files: ["lib"]`, jasmine/c8/eslint/jscpd scripts and config.
- Public API exported from `lib/index.js`: `BaseLogger`, `ConsoleLogger`, `LoggerGroup`, `Logger` (the group-aware one; the client uses it too, its single-logger version goes away). These four only import each other.
- What stays in `source/` and imports the base classes from the package: `Log`, `LogContext`, `LogFactory`, `LogFilter` and `buffer/` (`BufferedLogger` extends `BaseLogger`).

## Files to Change
- `docs/agents/specs/deku-sprout/overview.md` — new
- `docs/agents/specs/deku-sprout/package.md` — new
