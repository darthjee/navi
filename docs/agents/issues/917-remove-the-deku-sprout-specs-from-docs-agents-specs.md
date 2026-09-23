# Issue: Remove the deku-sprout specs from docs/agents/specs

## Description
Part 7 of 7 of #888, and the last one. The `deku-sprout` design specs written in #911 (`docs/agents/specs/deku-sprout.md` and `docs/agents/specs/deku-sprout/*.md`) were a guideline for work that was not implemented yet. All the other sub-issues (#911–#916) are now closed, so the package is extracted, released and linked, and the permanent docs should supersede the specs.

## Problem
- The specs are still linked from permanent files:
  - `logger/README.md:19`
  - `.claude/agents/logger.md:9` and `:55`
  - `docs/agents/logger.md:11`
  - `docs/agents/architecture/source-layout.md:10`
- Some of those files still describe the package as not built yet. `.claude/agents/logger.md` says "the layout below is the planned one, not yet on disk". `source-layout.md` says "empty until scaffolded". `docs/agents/logger.md` says "No logging classes exist yet" and that the classes "land in #914".
- `docs/agents/logger.md` is 11 lines long. It has no class-by-class reference like [Worker Subsystem](docs/agents/worker.md), and it does not cover the release flow or the design decisions that are currently only in the specs.

## Expected Behavior
- `docs/agents/specs/deku-sprout.md` and `docs/agents/specs/deku-sprout/` no longer exist.
- `docs/agents/specs/` and its `AGENTS.md` entry stay. Since #911 the folder has replaced `docs/agents/future/` and is the permanent home for specs of work that is not implemented yet (it still holds `crawler`).
- No file outside `docs/agents/issues/` and `docs/agents/plans/` links to the deleted specs.
- The permanent docs describe `deku-sprout` as it is now, and nothing useful was only in the specs.

## Solution
- Delete `docs/agents/specs/deku-sprout.md` and `docs/agents/specs/deku-sprout/`.
- Turn `docs/agents/logger.md` into a permanent subsystem doc, mirroring `docs/agents/worker.md`: an overview, a class-by-class reference for `BaseLogger`, `ConsoleLogger`, `LoggerGroup` and `Logger`, the consumers (`source/`, `clients/node/`, `dev/app`), the release flow (CI jobs, force parameter, `bump_version.sh` target, tags), and a short "Design decisions" section. That section summarizes the reasoning in `specs/deku-sprout/decisions.md`: why a new package and not `deku-swarm`, why it is public on npm, why the name, why the four classes, why `dev/app` is a consumer, and why the client now has a runtime dependency. Remove the "Current status" section. All of this is done in this issue, together with the deletion.
- Update `.claude/agents/logger.md` so it no longer describes the staged build-up, and point its links at `docs/agents/logger.md`.
- Update `logger/README.md` and `docs/agents/architecture/source-layout.md` so they drop the spec links and the "empty until scaffolded" wording.
- Before deleting, check the specs (`decisions.md`, `release-flow.md`, `package.md`, `migration.md`) for anything the permanent docs don't cover yet.

## Benefits
- No stale specs describing work that has already shipped
- No links to deleted files
- `deku-sprout` gets a full permanent reference, like `deku-swarm`
