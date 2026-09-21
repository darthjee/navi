# Package

## What it is

- **Name:** `deku-sprout`, a public, unscoped npm package (like `deku-swarm`).
- **Location:** `logger/` at the repository root, next to `worker/`.
- **Owner:** the `logger` agent (created in #912). Its npm-facing `README.md` is owned by the `docs` agent.

## Shape

The package mirrors `worker/package.json` (`deku-swarm`): ESM (`"type": "module"`), `main: lib/index.js`, `files: ["lib"]`, and the same jasmine, c8, eslint and jscpd scripts and configuration.

## Public API

Exported from `lib/index.js`:

| Export | Role |
|---|---|
| `BaseLogger` | Base class with the level handling and the logging methods. |
| `ConsoleLogger` | `BaseLogger` writing to the console. |
| `LoggerGroup` | A group of loggers a message is dispatched to. |
| `Logger` | The group-aware logger. The client uses it too; its single-logger version goes away. |

These four classes only import each other, which is what makes them extractable without dragging Navi-specific code along.

## What stays in `source/`

`Log`, `LogContext`, `LogFactory`, `LogFilter` and `buffer/` are Navi-specific. They stay in `source/lib/common/utils/logging/` and import the base classes from the package (for instance `BufferedLogger` extends `BaseLogger`).
