import fs from 'node:fs';

const CGROUP_V2_MEMORY_MAX_PATH = '/sys/fs/cgroup/memory.max';
const UNBOUNDED = 'max';

/**
 * Reads the cgroup v2 memory limit (`memory.max`), returning `null` when the
 * file is missing/unreadable (e.g. non-Linux dev machines, bare hosts, or
 * hosts not running under cgroup v2) or reports the literal `"max"`, cgroup
 * v2's own way of expressing "unbounded".
 * @author darthjee
 */
class CgroupV2MemoryLimitReader {
  /**
   * @returns {number|null} The cgroup v2 memory limit in bytes, or `null` when unavailable/unbounded.
   */
  read() {
    const content = this.#readFile();

    if (content === null || content === UNBOUNDED) return null;

    return Number(content);
  }

  /**
   * @returns {string|null} The trimmed file content, or `null` when it cannot be read.
   * @private
   */
  #readFile() {
    try {
      return fs.readFileSync(CGROUP_V2_MEMORY_MAX_PATH, 'utf8').trim();
    } catch {
      return null;
    }
  }
}

export { CgroupV2MemoryLimitReader };
