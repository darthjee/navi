# Issue: PMD InnaccurateNumericLiteral false positives in memory spec files

## Description
Codacy/PMD's `InnaccurateNumericLiteral` rule fires 24 times, all inside spec/test files, on numeric literals well within `Number.MAX_SAFE_INTEGER` (e.g. `104857600`, `123456789`, `17179869184`). These are false positives — the rule appears to flag literals based on length/magnitude rather than genuine floating-point precision loss.

Affected files:
- `frontend/spec/components/MemoryStatus_spec.js` (lines 50, 80, 97, 114, 131)
- `frontend/spec/components/MemoryStatusHelper_spec.js` (lines 51, 76, 88)
- `frontend/spec/components/MemoryUsageChart_spec.js` (lines 39, 48, 62, 63, 64, 68)
- `frontend/spec/clients/MemoryStatusClient_spec.js` (lines 8, 9)
- `frontend/spec/utils/formatBytes_spec.js` (lines 24, 30)
- `source/spec/lib/utils/memory/OsTotalMemoryReader_spec.js` (lines 7, 11)
- `source/spec/lib/utils/memory/CgroupV1MemoryLimitReader_spec.js:15`
- `source/spec/lib/utils/memory/CgroupV2MemoryLimitReader_spec.js:15`
- `source/spec/lib/utils/memory/ProcessRssReader_spec.js` (lines 6, 10)

This noise makes it easy to miss the one genuine instance of this pattern in production code (`source/lib/utils/memory/CgroupV1MemoryLimitReader.js:14`, the documented `UNBOUNDED` literal, already addressed in #842).

## Problem
`.codacy.yaml` already lists `frontend/spec/` and `source/spec/` under `excluded_paths` (added in #552, merged before the commits that introduced these spec literals). Despite that, querying the Codacy API directly (2026-09-16) confirms all 25 open `PMD_category_ecmascript_errorprone_InnaccurateNumericLiteral` issues are still active, including the 24 spec-file false positives — meaning the existing path exclusion is not suppressing this rule's findings for directories that are already excluded.

## Expected Behavior
Spec files under the already-excluded `frontend/spec/` and `source/spec/` paths should not surface `InnaccurateNumericLiteral` findings. Only genuine unsafe-literal cases in production code should ever be flagged by this rule.

## Solution
Investigate why `.codacy.yaml`'s `excluded_paths` is not suppressing this rule for directories it already lists, rather than assuming the fix is a brand-new exclusion or manual false-positive marking:

- Confirm whether `excluded_paths` is meant to apply to issue-scanning tools like PMD at all, or only to metrics such as coverage/duplication (check Codacy's current docs/support for the exact scope of this key).
- Check whether the key/format in `.codacy.yaml` is the one Codacy currently expects (e.g. `excluded_paths` vs. another key, glob syntax requirements).
- If the config is correct but Codacy simply has not re-applied it to already-analyzed commits, determine whether a fresh analysis/re-scan is needed and how to trigger it.
- If path exclusion turns out not to be the right mechanism for suppressing specific rules in specific directories, fall back to configuring the `PMD_category_ecmascript_errorprone_InnaccurateNumericLiteral` pattern itself (via Codacy's pattern configuration) to not apply to spec/test files.

## Benefits
- Removes 24 false-positive findings so the one genuine `InnaccurateNumericLiteral` case in production code is not buried in noise.
- Fixes the exclusion mechanism itself, which likely also silently fails to suppress other rules/tools for these already-excluded spec directories.
