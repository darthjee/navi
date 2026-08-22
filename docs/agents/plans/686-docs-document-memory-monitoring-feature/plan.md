# Plan: Docs: document memory monitoring feature

Issue: [686-docs-document-memory-monitoring-feature.md](../issues/686-docs-document-memory-monitoring-feature.md)

## Overview

Document the now-merged memory monitoring feature — the `GET /memory/status.json` endpoint + `web.memory` config (backend, #684/PR #689) and the `/#/memory/status` dashboard screen (frontend, #685/PR #690) — in `README.md` and `DOCKERHUB_DESCRIPTION.md`, and do a small related housekeeping rename of `docs/guides/HOW_TO_USE_NAVI.md`. No source changes.

## Agents involved

- [docs](docs.md)
- [architect](architect.md)

## Shared contracts

- Renamed path: `docs/guides/HOW_TO_USE_NAVI.md` → `docs/guides/how_to_use_navi.md`. `docs` performs the actual `git mv` and updates every reference within its own scope (`README.md`, `DOCKERHUB_DESCRIPTION.md`, `source/README.md`, `docs/guides/navi/*.md`, `docs/guides/navi-client/reference.md`). `architect` depends on this exact new path/casing landing first to update its own two references, which sit outside `docs`'s scope: `.claude/agents/architect.md` and `.claude/agents/docs.md` (the agent-roster table/description entries).
- No API/data-shape contracts are involved — this is a documentation-only issue.
