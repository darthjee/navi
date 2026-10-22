# Plan: Write the release-cycle spec in docs/agents/specs/release.md and release/*.md

Issue: [979-write-the-release-cycle-spec-in-docs-agents-specs-release-md-and-release-md.md](../../issues/979-write-the-release-cycle-spec-in-docs-agents-specs-release-md-and-release-md.md)

## Overview
Write the release-cycle overhaul spec (epic #977). It is a hub, `docs/agents/specs/release.md`, with topic files under `docs/agents/specs/release/`, and is listed in `docs/agents/specs.md`. The change is docs only and owned by the architect. No specialist agent has work.

## Context
- Today CI (`.circleci/config.yml`) uses several tag families: `X.Y.Z`, `client-X.Y.Z`, and `worker-`/`deku-sprout-` (the last are pushed by `scripts/ci/check-and-publish-package.sh`).
- The target behavior and every decision are listed in the issue's "Decisions" section. That section is the source of truth. Where it conflicts with the raw #977 text (names, the client and swarm dependencies, the swarm tag version), the issue wins.
- `docs/agents/specs.md` already exists (#978, merged in #981).
- Follow the crawler spec pattern (`docs/agents/specs/crawler.md`):
  - a one-paragraph intro;
  - a `| Topic | Description |` table linking the topic files;
  - a numbered `| # | Decision | Rationale |` table in `decisions.md`.

## Steps

- [01 — Write the release spec hub and topic files](plan/01-release-spec-topics.md)
- [02 — Write decisions, gaps and the implementation breakdown](plan/02-decisions-gaps-breakdown.md)
- [03 — List the spec in the specs hub](plan/03-specs-hub-row.md)

## Notes
- Docs only: do not touch `.circleci/`, `scripts/`, the `package.json` files, or create `release.yml`. The spec only describes `release.yml`; creating it is an implementation sub-issue.
- Every factual claim about the current setup must match the repo (job names, script paths, package names `navi-hey` / `navi-hey-client` / `deku-sprout` / `deku-swarm`, images `darthjee/navi-hey` / `darthjee/navi-hey-client`).
- The cleanup sub-issue (#980) will remove `docs/agents/specs/release.md` and `docs/agents/specs/release/` later, so other docs should not link deep into them except through the hub row.
- Check: every relative link in the new files resolves.
