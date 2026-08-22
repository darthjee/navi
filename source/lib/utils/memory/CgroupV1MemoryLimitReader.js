import fs from 'node:fs';

const CGROUP_V1_MEMORY_LIMIT_PATH = '/sys/fs/cgroup/memory/memory.limit_in_bytes';
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
