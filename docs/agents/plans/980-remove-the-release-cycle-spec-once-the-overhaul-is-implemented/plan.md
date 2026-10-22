# Plan: Remove the release-cycle spec once the overhaul is implemented

Issue: [980-remove-the-release-cycle-spec-once-the-overhaul-is-implemented.md](../../issues/980-remove-the-release-cycle-spec-once-the-overhaul-is-implemented.md)

## Overview
This is the last sub-issue of epic #977. It moves the lasting release knowledge from the spec into a new permanent agent doc, `docs/agents/release.md`. It then updates the agent docs that still describe the old pipeline. Finally it deletes `docs/agents/specs/release.md` and `docs/agents/specs/release/`, and removes the Release row from `docs/agents/specs.md`. The hub itself stays. The architect owns all of this work (agent docs and the root `AGENTS.md`).

## Context
- The specs hub convention (`docs/agents/specs.md`) says a spec is removed once its work is implemented and documented in its permanent place. When a spec is deleted, its hub row is removed in the same change.
- **Blocked:** start only once implementation sub-issues 1 to 7 of #977 are merged. They are listed in `docs/agents/specs/release/implementation.md`. Before writing anything, check the real `.circleci/config.yml`, `scripts/`, and `release.yml`. Document what was actually implemented, which may differ from the spec.
- `docs/agents/issues/` and `docs/agents/plans/` are historical and are never edited.

## Steps

- [01 — Write docs/agents/release.md](plan/01-write-release-doc.md)
- [02 — Update release-token.md](plan/02-update-release-token.md)
- [03 — Sweep agent docs for old-pipeline references](plan/03-sweep-agent-docs.md)
- [04 — Delete the spec and its hub row](plan/04-delete-spec.md)

## Notes
- If any implementation sub-issue of #977 is still open, stop. Do not delete the spec early.
- Only documentation changes are expected, so no CI test job applies beyond the normal pipeline.
- Final check: `grep -rn "specs/release" --include=*.md . | grep -v node_modules | grep -v "docs/agents/issues\|docs/agents/plans"` returns nothing.
