# Plan: PMD InnaccurateNumericLiteral false positives in memory spec files

Issue: [847-pmd-innaccuratenumericliteral-false-positives-in-memory-spec-files.md](../../issues/847-pmd-innaccuratenumericliteral-false-positives-in-memory-spec-files.md)

## Overview
Fix `.codacy.yaml` itself: it already lists `frontend/spec/` and `source/spec/` for exclusion, but under the wrong key (`excluded_paths` instead of Codacy's documented `exclude_paths`) and without the required leading `---` YAML document marker — so Codacy silently ignores the whole file and keeps analyzing those directories. No specialist agent owns this: `.codacy.yaml` is a root-level config file with no code changes in `frontend/`, `source/`, `dev/`, etc.

## Context
Querying the Codacy API confirmed all 25 open `PMD_category_ecmascript_errorprone_InnaccurateNumericLiteral` issues are still active, 24 of them inside `frontend/spec/` and `source/spec/` — directories `.codacy.yaml` already lists under `excluded_paths`. Cross-checking Codacy's own docs (`docs.codacy.com/repositories-configure/codacy-configuration-file`) shows:
- The correct top-level key is `exclude_paths`, not `excluded_paths`.
- The file must start with a `---` document marker on its own first line.

The repo's current `.codacy.yaml` has neither: it uses `excluded_paths` and has no leading `---`. That fully explains why the exclusion has never taken effect, independent of when the directories were added to the list or which commits came after.

## Implementation Steps

### Step 1 — Correct `.codacy.yaml`'s key name and add the required document marker
Rename the top-level `excluded_paths:` key to `exclude_paths:` and add a leading `---` line, per Codacy's documented syntax. Keep every existing path entry unchanged — only the key name and the document marker change.

### Step 2 — Confirm the fix takes effect
Once this is merged and Codacy re-analyzes the branch/PR, re-run `codacy_list_repository_issues` (pattern `PMD_category_ecmascript_errorprone_InnaccurateNumericLiteral`) and confirm the 24 issues under `frontend/spec/` and `source/spec/` are gone, leaving only the one genuine production-code instance in `source/lib/utils/memory/CgroupV1MemoryLimitReader.js` (already addressed separately in #842). This is a verification step, not a code change — do it after the PR is open so Codacy has analyzed the corrected config.

## Files to Change
- `.codacy.yaml` — rename `excluded_paths` to `exclude_paths` and add a leading `---` document marker, so the existing spec-directory exclusions actually take effect.

## Notes
- No CI job exercises `.codacy.yaml` locally — Codacy's own re-analysis after the PR is pushed is the only way to confirm Step 2, so it can't be verified before opening the PR.
- If Codacy still reports issues in these paths after this fix (i.e. the key/marker fix theory turns out incomplete), fall back to configuring the `PMD_category_ecmascript_errorprone_InnaccurateNumericLiteral` pattern directly (e.g. disabling it for spec/test files via Codacy's pattern configuration) rather than relying on path exclusion.
