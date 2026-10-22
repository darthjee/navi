# Document the new files
- **`docs/agents/folder-structure.md`**: mention `release.yml` at the root and `scripts/release/` (the release-tree validator package) under `scripts/`.
- **`docs/agents/specs/release/packages.md`**: replace "Illustrative format (the exact keys are settled by the implementation sub-issue)" with a note that the format is now settled in the root `release.yml`. Keep the example in sync with the real file. This spec is temporary and is deleted by #980.
- **`scripts/release/README.md`** (short): what the package does, how to run the validator and the specs locally, and that `release.yml` is its input.

## Files to Change
- `docs/agents/folder-structure.md` — list `release.yml` and `scripts/release/`.
- `docs/agents/specs/release/packages.md` — note the settled format.
- `scripts/release/README.md` — new.
