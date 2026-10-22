# Delete the spec and its hub row
Once steps 01–03 have captured everything lasting, delete the spec. In the same change, remove the `| [Release](specs/release.md) | ... |` row from the `docs/agents/specs.md` table. Keep the hub, its conventions and the Crawler row. If the table would end up empty (it will not, because Crawler remains), the conventions say to use `_No specs at the moment._`. Then grep for `specs/release` and fix any link left outside `docs/agents/issues/` and `docs/agents/plans/`.

## Files to Change
- `docs/agents/specs/release.md` — delete.
- `docs/agents/specs/release/` — delete the folder: `overview.md`, `tags.md`, `packages.md`, `detection.md`, `ci-flow.md`, `examples.md`, `decisions.md`, `gaps.md` and `implementation.md`.
- `docs/agents/specs.md` — remove the Release row.
