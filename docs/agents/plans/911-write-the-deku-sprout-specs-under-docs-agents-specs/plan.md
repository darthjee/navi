# Plan: Write the deku-sprout specs under docs/agents/specs

Issue: [911-write-the-deku-sprout-specs-under-docs-agents-specs.md](../../issues/911-write-the-deku-sprout-specs-under-docs-agents-specs.md)

## Overview
Documentation-only change. Turn `docs/agents/specs/` into the home for specs of not-yet-implemented work (replacing `docs/agents/future/`), and write the design specs of the `deku-sprout` logging package as a hub (`docs/agents/specs/deku-sprout.md`) plus six topic files under `docs/agents/specs/deku-sprout/`, at design level (what, why, decisions, ordering — not step-by-step checklists).

## Context
Part 1 of 7 of #888, which extracts the duplicated logging code of `source/` and `clients/node/` into a public npm package, `deku-sprout`, living in `logger/` and owned by a new `logger` agent, following the `deku-swarm` model. The specs written here are the guideline for the other sub-issues (#912–#917); the `deku-sprout` specs are deleted by #917, but `docs/agents/specs/` itself is permanent.

Existing precedent to follow: `docs/agents/future/crawler.md` (a short intro plus a `Topic | Description` table) with its topic files in `docs/agents/future/crawler/`, and the same hub + subfolder shape of `docs/agents/architecture.md` + `docs/agents/architecture/`. Only `AGENTS.md` (table row + "Future" section) and `README.md:472` reference `docs/agents/future`.

## Steps

- [01 — Migrate `future/` to `specs/`](plan/01-migrate-future-to-specs.md)
- [02 — Update `AGENTS.md` and the `README.md` link](plan/02-update-agents-md-and-readme.md)
- [03 — Write the `deku-sprout` hub](plan/03-write-the-hub.md)
- [04 — Write `overview.md` and `package.md`](plan/04-write-overview-and-package.md)
- [05 — Write `migration.md` and `release-flow.md`](plan/05-write-migration-and-release-flow.md)
- [06 — Write `rollout.md` and `decisions.md`](plan/06-write-rollout-and-decisions.md)
- [07 — Verify links and conventions](plan/07-verify.md)

## Notes
- No CI job covers these files (no markdown lint or link check in `.circleci/config.yml`); verification is the manual link check in step 07.
- No owning specialist: `docs/agents/*` and `AGENTS.md` are `architect`-owned, so the whole issue is done by the architect. The single `README.md` line is nominally in the `docs` agent's scope; it is a one-line link fix and may be done inline or delegated to `docs`.
- The specs are written to the facts recorded in #888 and its sub-issues; when a fact could have drifted (file names, CI job names), check it against the repository before writing it down.
- Do not create `logger/`, the `logger` agent, or change any code, package or CI file; those belong to #912–#916.
