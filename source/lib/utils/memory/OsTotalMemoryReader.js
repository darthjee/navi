import os from 'node:os';

/**
 * Wraps Node's `os.totalmem()`, the last resort in the memory-maximum
 * resolution chain — it always returns a number, never `null`.
 * @author darthjee
 */
class OsTotalMemoryReader {
  /**
   * @returns {number} The total system memory, in bytes.
   */
  read() {
    return os.totalmem();
  }
}

export { OsTotalMemoryReader };
