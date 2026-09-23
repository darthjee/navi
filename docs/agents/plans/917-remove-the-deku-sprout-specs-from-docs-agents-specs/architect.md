# Architect Plan: Remove the deku-sprout specs from docs/agents/specs

Main plan: [plan.md](plan.md)

## Shared contracts

See [plan.md](plan.md#shared-contracts). This agent uses all of it: the public API, the consumers and the release flow.

## Steps

- [01 — Rewrite docs/agents/logger.md as a permanent subsystem doc](architect/01-rewrite-logger-doc.md)
- [02 — Update the logger agent definition](architect/02-update-logger-agent.md)
- [03 — Fix the other stale references and index entries](architect/03-fix-stale-references.md)
- [04 — Delete the specs and verify no links remain](architect/04-delete-specs.md)

## Notes
- Do step 04 last. The specs are the source material for step 01, so read them before deleting.
- Don't edit files under `docs/agents/issues/` or `docs/agents/plans/`. They are historical records and may keep their links to the deleted specs.
- The spec's release-flow names (`logger-X.Y.Z`, `bump_version.sh logger`, `*-logger` jobs) do not match what shipped. Always use the names in the shared contracts.
