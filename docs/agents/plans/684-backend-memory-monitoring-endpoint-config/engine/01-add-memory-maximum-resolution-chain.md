# Add the memory-maximum resolution chain

Build the **Config → cgroup v2 → cgroup v1 → OS total memory** fallback chain as one small,
independently-testable reader class per source, plus one orchestrator that composes them. Each
reader exposes a single `read()` method returning a byte count (`number`) or `null` when that
source has no limit to offer — readers never throw for the "no limit here" case, only for
genuinely unexpected I/O errors (which should still be caught internally and treated as `null`,
since a missing/unreadable cgroup file is expected on non-Linux dev machines and bare hosts).

- `ConfigMemoryLimitReader` — wraps the raw `maximum` value from YAML config; `read()` returns it
  as-is (or `null` if not set).
- `CgroupV2MemoryLimitReader` — reads `/sys/fs/cgroup/memory.max`; returns `null` if the file is
  missing/unreadable or its content is the literal string `"max"`.
- `CgroupV1MemoryLimitReader` — reads `/sys/fs/cgroup/memory/memory.limit_in_bytes`; returns
  `null` if the file is missing/unreadable or the value is the kernel's "unbounded" sentinel
  (`9223372036854771712`).
- `OsTotalMemoryReader` — wraps Node's `os.totalmem()`; always returns a number (the last resort,
  never `null`).
- `MemoryMaximumResolver` — takes the configured `maximum` value and an optional injected list of
  readers (defaulting to the four above, in fallback order); `resolve()` calls each reader's
  `read()` in order and returns the first non-`null` result.

## Files to Change

- `source/lib/utils/memory/ConfigMemoryLimitReader.js` — new.
- `source/lib/utils/memory/CgroupV2MemoryLimitReader.js` — new.
- `source/lib/utils/memory/CgroupV1MemoryLimitReader.js` — new.
- `source/lib/utils/memory/OsTotalMemoryReader.js` — new.
- `source/lib/utils/memory/MemoryMaximumResolver.js` — new.
- `spec/lib/utils/memory/ConfigMemoryLimitReader_spec.js` — new.
- `spec/lib/utils/memory/CgroupV2MemoryLimitReader_spec.js` — new; cover file-present, missing,
  and `"max"` cases (stub `fs` access, don't depend on the real filesystem).
- `spec/lib/utils/memory/CgroupV1MemoryLimitReader_spec.js` — new; cover file-present, missing,
  and unbounded-sentinel cases.
- `spec/lib/utils/memory/OsTotalMemoryReader_spec.js` — new.
- `spec/lib/utils/memory/MemoryMaximumResolver_spec.js` — new; cover each fallback tier winning
  in turn via injected dummy readers.
