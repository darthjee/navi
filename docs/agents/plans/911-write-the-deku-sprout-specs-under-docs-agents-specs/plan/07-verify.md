# Verify links and conventions
Check the result before committing:
- Every relative link in `docs/agents/specs/deku-sprout.md` and `docs/agents/specs/deku-sprout/*.md` resolves to an existing file, and so do the moved crawler docs (`docs/agents/specs/crawler.md` → `crawler/*.md`).
- `grep -rn "agents/future\|future/crawler"` (excluding `node_modules`, and historical issue/plan prose) returns nothing, and `docs/agents/future/` no longer exists.
- `AGENTS.md` and `README.md` render the new `Specs` row/section and the corrected link.
- The specs stay at design level, are written in English, and only touch documentation: `git status` shows changes under `docs/agents/`, `AGENTS.md` and `README.md` only.

## Files to Change
- None expected; fix whatever the checks above find in the files from steps 01–06.
