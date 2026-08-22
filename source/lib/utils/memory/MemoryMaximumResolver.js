import { CgroupV1MemoryLimitReader } from './CgroupV1MemoryLimitReader.js';
import { CgroupV2MemoryLimitReader } from './CgroupV2MemoryLimitReader.js';
import { ConfigMemoryLimitReader } from './ConfigMemoryLimitReader.js';
import { OsTotalMemoryReader } from './OsTotalMemoryReader.js';

/**
 * Resolves the effective memory maximum via a fallback chain: configured
 * value → cgroup v2 limit → cgroup v1 limit → OS total memory. Each reader
 * exposes a `read()` method returning a byte count or `null` when that source
 * has no limit to offer; the first non-`null` result wins.
 * @author darthjee
 */
class MemoryMaximumResolver {
  #readers;

  /**
   * @param {number} [maximum] - The configured `web.memory.maximum` value, if any.
   * @param {object} [options={}] - Additional options.
   * @param {Array<{read: Function}>} [options.readers] - Ordered list of readers to consult,
   * defaulting to the config → cgroup v2 → cgroup v1 → OS total memory chain.
   */
  constructor(maximum, { readers } = {}) {
    this.#readers = readers ?? [
      new ConfigMemoryLimitReader(maximum),
      new CgroupV2MemoryLimitReader(),
      new CgroupV1MemoryLimitReader(),
      new OsTotalMemoryReader(),
    ];
  }

  /**
   * Resolves the memory maximum for the given configured value.
   * @param {number} [maximum] - The configured `web.memory.maximum` value, if any.
   * @returns {number|null} The resolved memory maximum, in bytes.
   */
  static resolve(maximum) {
    return new MemoryMaximumResolver(maximum).resolve();
  }

  /**
   * Consults each reader in order, returning the first non-`null` result.
   * @returns {number|null} The resolved memory maximum, in bytes.
   */
  resolve() {
    for (const reader of this.#readers) {
      const value = reader.read();

      if (value !== null) return value;
    }

    return null;
  }
}

export { MemoryMaximumResolver };
