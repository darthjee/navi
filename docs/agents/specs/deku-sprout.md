# Feature: `deku-sprout` — Shared Logging Package

This feature extracts the logging code that `source/` and `clients/node/` currently keep as duplicated copies into a public npm package, `deku-sprout`, living in `logger/` and following the same model as `deku-swarm` (`worker/`). Tracked by [#888](https://github.com/darthjee/navi/issues/888). **This is a spec of not-yet-implemented work**: it is a guideline for the sub-issues of #888 and is deleted by #917 once the feature is implemented (the `docs/agents/specs/` folder itself stays).

| Topic | Description |
|---|---|
| [Overview](deku-sprout/overview.md) | Why the package exists: the duplication between `source/` and `clients/node/`, goals and non-goals. |
| [Package](deku-sprout/package.md) | What `deku-sprout` is: location, owner, `package.json` shape, public API, and what stays in `source/`. |
| [Migration](deku-sprout/migration.md) | Move map, what changes in each consumer (`source/`, `clients/node/`, `dev/app`), and Docker/compose handling. |
| [Release Flow](deku-sprout/release-flow.md) | The `deku-swarm` release model applied to the new package: CI jobs, publish, version bump, tags, version coordination. |
| [Rollout](deku-sprout/rollout.md) | The seven sub-issues of #888 in order and their dependencies. |
| [Decisions](deku-sprout/decisions.md) | Decisions taken in #888 and their rationale. |
