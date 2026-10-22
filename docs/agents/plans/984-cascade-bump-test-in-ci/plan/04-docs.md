# Docs

- `scripts/release/README.md`: describe the package as holding both the validator and the cascade-bump check; add a "Cascade-bump check" section (rule, base ref per CI context, usage `scripts/ci.sh cascade-bump-check` and the direct CLI with an optional base ref).
- `docs/agents/specs/release/detection.md#cascade-bump-test`: replace "the implementation sub-issue settles the exact refs" with the settled refs (merge base with `origin/main` on branches, previous `X.Y.Z` tag from `HEAD^` on tags, `HEAD^` on `main`, pass when no base) and point at `scripts/ci.sh cascade-bump-check`.
- `docs/agents/folder-structure.md`: update the `scripts/release/` line to mention the cascade-bump check, if it only names the validator.

## Files to Change
- `scripts/release/README.md` — document the new check.
- `docs/agents/specs/release/detection.md` — settled refs.
- `docs/agents/folder-structure.md` — `scripts/release/` description.
