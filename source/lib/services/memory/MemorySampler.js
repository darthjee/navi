import { MemoryRegistry } from '../../registry/MemoryRegistry.js';
import { ProcessRssReader } from '../../utils/memory/ProcessRssReader.js';

/**
 * Samples process RSS into {@link MemoryRegistry} on a fixed interval, driven by
 * `memoryConfig.dataStoreInterval`. The sampler is the sole writer of the retained
 * memory-history buffer — see the parent issue's _Alternatives considered_ for why a
 * fixed-cadence sampler was chosen over sample-on-request.
 * @author darthjee
 */
class MemorySampler {
  #memoryConfig;
  #setInterval;
  #clearInterval;
  #rssReader;
  #handle;

  /**
   * @param {import('../../models/configs/MemoryConfig.js').MemoryConfig} memoryConfig - The
   * resolved `web.memory` configuration.
   * @param {object} [options={}] - Injectable collaborators.
   * @param {Function} [options.setInterval] - Scheduler used to arm the sampling interval,
   * defaulting to the global `setInterval`.
   * @param {Function} [options.clearInterval] - Scheduler used to disarm the sampling interval,
   * defaulting to the global `clearInterval`.
   * @param {{read: Function}} [options.rssReader] - Reader used to obtain the current process
   * RSS, defaulting to {@link ProcessRssReader}.
   */
  constructor(memoryConfig, {
    setInterval: setIntervalFn = globalThis.setInterval,
    clearInterval: clearIntervalFn = globalThis.clearInterval,
    rssReader = new ProcessRssReader()
  } = {}) {
    this.#memoryConfig = memoryConfig;
    this.#setInterval = setIntervalFn;
    this.#clearInterval = clearIntervalFn;
    this.#rssReader = rssReader;
    this.#handle = null;
  }

  /**
   * Takes one immediate synchronous sample, then arms the sampling interval. No-ops
   * when already started (a second `start()` while running does not leak a second
   * interval).
   * @returns {void}
   */
  start() {
    if (this.#handle) return;

    this.#tick();

    this.#handle = this.#setInterval(() => this.#tick(), this.#memoryConfig.dataStoreInterval * 1000);
    this.#handle.unref?.();
  }

  /**
   * Disarms the sampling interval. Idempotent — a second `stop()` no-ops.
   * @returns {void}
   */
  stop() {
    if (!this.#handle) return;

    this.#clearInterval(this.#handle);
    this.#handle = null;
  }

  /**
   * Reads the current process RSS and records it into {@link MemoryRegistry}. Swallows
   * any error so a failing read/write never crashes the process from inside a
   * `setInterval` callback; the sample is simply skipped.
   * @returns {void}
   * @private
   */
  #tick() {
    try {
      const value = this.#rssReader.read();
      const percentage = value / this.#memoryConfig.maximum * 100;

      MemoryRegistry.add(value, percentage);
    } catch {
      // Best-effort sampling: skip this sample rather than crash the process.
    }
  }
}

export { MemorySampler };
