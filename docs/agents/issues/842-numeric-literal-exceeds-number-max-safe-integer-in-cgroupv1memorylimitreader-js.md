# Issue: Numeric literal exceeds Number.MAX_SAFE_INTEGER in CgroupV1MemoryLimitReader.js

## Description
Codacy's `PMD_category_ecmascript_errorprone_InnaccurateNumericLiteral` rule flags the `UNBOUNDED` constant in `source/lib/utils/memory/CgroupV1MemoryLimitReader.js:4`:

```js
const UNBOUNDED = 9223372036854771712;
```

because it exceeds `Number.MAX_SAFE_INTEGER` (`9007199254740991`), which normally signals that a JS numeric literal may silently lose precision at runtime.

This is the one non-false-positive hit of this Codacy rule in the codebase — see the companion issue #847 for the ~24 other (false-positive) hits of the same rule confined to memory spec files.

## Problem
Investigation shows this specific literal does **not** actually lose precision, and is not an approximation of int64 max:

- `9223372036854771712` equals `0x7FFFFFFFFFFFF000` (`2^63 - 2^12`) — the real Linux cgroup v1 kernel "unbounded" sentinel for `memory.limit_in_bytes`, which the kernel reports page-aligned (a multiple of 4096) on 64-bit hosts. It is **not** an attempted approximation of int64 max (`9223372036854775807`); the two are genuinely different values 4096 apart, by kernel design.
- Because the value is a multiple of 4096, it happens to fall within the double-precision integers that remain exactly representable even above `Number.MAX_SAFE_INTEGER`: `BigInt(9223372036854771712)` round-trips to the exact literal, and parsing the kernel's own file content (`Number('9223372036854771712')`) reproduces the identical double both times.
- `CgroupV1MemoryLimitReader_spec.js` already has a passing test asserting `read()` returns `null` for exactly this sentinel string, confirming the comparison works correctly today.

So Codacy's rule is flagging a real risk pattern (a numeric literal past `MAX_SAFE_INTEGER`) that happens, in this one case, not to be an actual bug — the value is intentional, correct, and verified to compare exactly.

## Expected Behavior
`CgroupV1MemoryLimitReader#read()` continues to correctly recognize the kernel's unbounded sentinel and return `null` for it, with no change to the comparison's runtime behavior — and the Codacy finding is resolved (fixed or knowingly suppressed) without introducing a regression.

## Solution
Given the literal is confirmed correct and exact, do **not** change its value/semantics:
- **Ruled out:** replacing it with `Number.MAX_SAFE_INTEGER` — that is a different number from the kernel's actual sentinel (`9223372036854771712` vs. `9007199254740991`) and would silently break the existing passing spec and the real-world unbounded detection. This option must not be used.
- **Ruled out (unnecessary):** a `BigInt` rewrite — adds comparison-path complexity for no behavioral benefit, since the existing `Number` comparison already round-trips exactly.

Preferred direction:
1. Keep the literal as-is in `source/lib/utils/memory/CgroupV1MemoryLimitReader.js`, and add a code comment documenting why it is safe (the page-alignment reasoning above), so future readers don't mistake it for a bug.
2. Suppress the Codacy finding at the config level via `.codacy.yaml`, scoped as narrowly as Codacy's config format allows (ideally this one rule for this one file — `PMD_category_ecmascript_errorprone_InnaccurateNumericLiteral` on `source/lib/utils/memory/CgroupV1MemoryLimitReader.js` — rather than excluding the whole file from all scanning, to avoid masking unrelated future findings in it). This is a deliberate trade-off: it's coarser than an inline suppression (e.g. the `eslint-disable` + stub-rule pattern from #840/PR #856) but keeps the source file untouched by suppression mechanics.

## Benefits
Resolves the Codacy finding with an outcome that matches reality (documented, verified-safe constant) instead of a semantic change that could break real-world unbounded-memory detection on cgroup v1 hosts.
