import fs from 'node:fs';

const CGROUP_V1_MEMORY_LIMIT_PATH = '/sys/fs/cgroup/memory/memory.limit_in_bytes';
// 9223372036854771712 (0x7FFFFFFFFFFFF000, i.e. 2^63 - 2^12) is the real Linux
// cgroup v1 kernel "unbounded" sentinel for `memory.limit_in_bytes`, page-aligned
// (4096-byte multiple) by the kernel — it is NOT an approximation of int64 max
// (9223372036854775807). Because it's a multiple of 4096, it is exactly
// representable as a JS double despite exceeding Number.MAX_SAFE_INTEGER, so
// `Number(content) === UNBOUNDED` reproducibly matches (verified via
// `BigInt(UNBOUNDED)` round-tripping to this exact literal). Do NOT change this
// to `Number.MAX_SAFE_INTEGER` (a different value, which would break real
// unbounded detection) or to a `BigInt` (unnecessary, since the existing
// comparison already round-trips exactly).
const UNBOUNDED = 9223372036854771712;

/**
 * Reads the cgroup v1 memory limit (`memory.limit_in_bytes`), returning `null`
 * when the file is missing/unreadable (e.g. non-Linux dev machines, bare
 * hosts, or hosts not running under cgroup v1) or reports the kernel's
 * "unbounded" sentinel value.
 * @author darthjee
 */
class CgroupV1MemoryLimitReader {
  /**
   * @returns {number|null} The cgroup v1 memory limit in bytes, or `null` when unavailable/unbounded.
   */
  read() {
    const content = this.#readFile();

    if (content === null) return null;

    const value = Number(content);

    return value === UNBOUNDED ? null : value;
  }

  /**
   * @returns {string|null} The trimmed file content, or `null` when it cannot be read.
   * @private
   */
  #readFile() {
    try {
      return fs.readFileSync(CGROUP_V1_MEMORY_LIMIT_PATH, 'utf8').trim();
    } catch {
      return null;
    }
  }
}

export { CgroupV1MemoryLimitReader };
