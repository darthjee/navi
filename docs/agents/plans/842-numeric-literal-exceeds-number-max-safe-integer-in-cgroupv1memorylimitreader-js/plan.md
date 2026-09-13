# Plan: Numeric literal exceeds Number.MAX_SAFE_INTEGER in CgroupV1MemoryLimitReader.js

Issue: [842-numeric-literal-exceeds-number-max-safe-integer-in-cgroupv1memorylimitreader-js.md](../../issues/842-numeric-literal-exceeds-number-max-safe-integer-in-cgroupv1memorylimitreader-js.md)

## Overview
The `UNBOUNDED` literal in `CgroupV1MemoryLimitReader.js` is confirmed correct and exact (the real, page-aligned cgroup v1 kernel sentinel) — not a precision-loss bug. The fix documents that in place with a comment, and suppresses the Codacy finding via a scoped `.codacy.yaml` rule/path exclusion, without touching comparison semantics.

See [engine.md](engine.md) for the source-file step.

## Root-level config (architect-owned, not delegated)
`.codacy.yaml` lives at the repo root and governs Codacy scanning across every package in this monorepo — cross-cutting, root-level config per the architect's own scope. The architect will make this edit directly (not delegated to a specialist):

- `.codacy.yaml` — add a scoped exclusion for `PMD_category_ecmascript_errorprone_InnaccurateNumericLiteral` on `source/lib/utils/memory/CgroupV1MemoryLimitReader.js` only (not the whole file/path from all rules, to avoid masking unrelated future findings there). Codacy's config format only supports path-level `excluded_paths` (no rule-scoped exclusion), so if a rule-scoped exclusion isn't expressible, fall back to documenting the accepted finding in the issue/PR description instead of broadening `excluded_paths` — do not exclude the whole file from all Codacy rules just to silence this one.

## Notes
- Do not change the literal's value or replace it with `Number.MAX_SAFE_INTEGER` — confirmed incorrect (see issue).
- No `BigInt` rewrite — unnecessary, the existing `Number` comparison already round-trips exactly.
- No CI checks beyond the source package's existing lint/test jobs (see [engine.md](engine.md)); `.codacy.yaml` changes take effect on Codacy's next scan, not in local CI.
