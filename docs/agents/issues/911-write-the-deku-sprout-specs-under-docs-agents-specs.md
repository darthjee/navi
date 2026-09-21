## Description
Part 1 of 7 of #888 (extract the shared logging code into the `deku-sprout` package). Write the design specs first, so every following sub-issue has a guideline to implement against.

## Solution
Create `docs/agents/specs/deku-sprout.md` as a hub, split into topic files under `docs/agents/specs/deku-sprout/`, following the hub + subfolder pattern that `docs/agents/future/crawler.md` + `docs/agents/future/crawler/` already use (the hub is a short intro plus a `Topic | Description` table linking each file).

`docs/agents/specs/` is a new folder for specs of work that is not implemented yet, kept as a guideline while that work is being developed. It **replaces `docs/agents/future/`**, which is dropped:
- Move the existing content, `docs/agents/future/crawler.md` and `docs/agents/future/crawler/`, into `docs/agents/specs/` (with `git mv`, so the history follows) and remove `docs/agents/future/`. The relative links inside the crawler docs keep working since the hub and its folder move together.
- In `AGENTS.md`, replace the `Future` row of the folder table and the `Future (docs/agents/future/)` section with the equivalent for `docs/agents/specs/`: specs of not-yet-implemented work, one file per topic (`docs/agents/specs/<topic>.md`), split into a hub + subfolder when it grows, and removed once the feature is implemented and documented elsewhere.
- Fix the link in `README.md` (line 472) from `docs/agents/future/crawler/flows.md` to `docs/agents/specs/crawler/flows.md`, and any other reference to `docs/agents/future` found by a repository-wide search.

The folder is therefore permanent; only the `deku-sprout` specs inside it are temporary (removed by #917, which must not delete the folder or its `AGENTS.md` entry).

Proposed topic files:

| File | Content |
|---|---|
| `overview.md` | Why the package exists: the duplication between `source/` and `clients/node/` (Codacy numbers, duplicated specs), goals and non-goals. |
| `package.md` | `deku-sprout`: public unscoped npm package in `logger/`, owned by the `logger` agent, `package.json` shape, public API (`BaseLogger`, `ConsoleLogger`, `LoggerGroup`, `Logger`), and what stays in `source/` (`Log`, `LogContext`, `LogFactory`, `LogFilter`, `buffer/`). |
| `migration.md` | File-by-file move map, and what changes in each consumer: `source/`, `clients/node/` (gains a runtime dependency, uses the group-aware `Logger`) and `dev/app` (stops receiving logging through the `common/` copy); Dockerfile and `docker-compose.yml` handling. |
| `release-flow.md` | The `deku-swarm` model applied to the new package: CI jobs, `force_deku_sprout_build` parameter, publish script, `bump_version.sh` target, tags, README version lines, independent version bumps for the consumers, first publish. |
| `rollout.md` | The seven sub-issues of #888 in order, their dependencies (CI/publish must land before the client links to the package), and the final removal of these specs. |
| `decisions.md` | Decisions and rationale: extract now, public vs private, name (`deku-tree`, `sheikah`, `hylia` are taken on npm), full `Logger`/`LoggerGroup` included, `dev/app` as a consumer, the client stops being self-contained. |

The specs must capture the decisions taken in #888:
- Public, unscoped npm package `deku-sprout`, living in `logger/`, owned by a new `logger` agent, following the `deku-swarm` model (own version, auto-publish job on folder changes, `file:` dependency in development, `bump_version.sh` target, Dockerfile/compose handling, per-package CI jobs, README version lines, release tags).
- Contents: `BaseLogger`, `ConsoleLogger`, `LoggerGroup` and `Logger` (the group-aware one, used by the client too). `Log`, `LogContext`, `LogFactory`, `LogFilter` and `buffer/` stay in `source/` and import the base classes from the package.
- Consumers: `source/`, `clients/node/` and `dev/app`; independent version bumps (no forced release of `navi-hey`/`navi-hey-client` on a change to `deku-sprout`).
- The ordering of the sub-issues and their dependencies (CI/publish must land before the client links to the package).

The specs stay at design level (what and why, the decisions, the ordering), not a step-by-step checklist; the later sub-issues carry the concrete file and job lists.

Documentation only: no code, package or CI changes in this issue.

## Benefits
- One agreed design that the remaining sub-issues can point to
