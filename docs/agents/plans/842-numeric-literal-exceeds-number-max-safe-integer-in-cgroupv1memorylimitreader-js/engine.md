# Engine Plan: Numeric literal exceeds Number.MAX_SAFE_INTEGER in CgroupV1MemoryLimitReader.js

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Document why the `UNBOUNDED` literal is safe
Add a code comment directly above (or on) the `UNBOUNDED` constant in `source/lib/utils/memory/CgroupV1MemoryLimitReader.js` explaining:
- `9223372036854771712` is the real Linux cgroup v1 kernel "unbounded" sentinel for `memory.limit_in_bytes` (`0x7FFFFFFFFFFFF000`, i.e. `2^63 - 2^12`), page-aligned by the kernel — it is *not* an approximation of int64 max (`9223372036854775807`).
- Because the value is a multiple of 4096, it is exactly representable as a JS double despite exceeding `Number.MAX_SAFE_INTEGER` — `Number(content) === UNBOUNDED` reproducibly matches (verified via `BigInt(UNBOUNDED)` round-tripping to the exact literal).
- Do not change this to `Number.MAX_SAFE_INTEGER` (different value, would break real unbounded detection) or to a `BigInt` (unnecessary — the existing comparison already round-trips exactly).

No logic changes — `read()`'s behavior and the `UNBOUNDED` value itself stay exactly as they are today.

## Files to Change
- `source/lib/utils/memory/CgroupV1MemoryLimitReader.js` — add the explanatory comment above `const UNBOUNDED = 9223372036854771712;`. No behavior change.

## CI Checks
- `source`: `npm run lint` (CI job: `checks`)
- `source`: `npm test` (CI job: `jasmine`) — confirms `CgroupV1MemoryLimitReader_spec.js`'s existing sentinel-value test still passes unchanged

## Notes
- The `.codacy.yaml` suppression (root-level config) is handled directly by the architect — see [plan.md](plan.md). No action needed here beyond the comment.
