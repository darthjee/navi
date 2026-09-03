import { MemoryRegistryInstance } from './MemoryRegistryInstance.js';

/**
 * MemoryRegistry is a static singleton facade for the application's process-wide
 * memory-reading history (see {@link MemoryRegistryInstance}).
 *
 * Call `MemoryRegistry.build({ retention })` once during application bootstrap.
 * Use `MemoryRegistry.reset()` in tests to restore a clean state between examples.
 *
 * Strictness is intentionally asymmetric: `build` and the read helper (`getEntries`)
 * throw when the registry has not been built, while the write helper (`add`) silently
 * no-ops so the sampler can call it unconditionally without every spec having to build
 * the registry first.
 *
 * The facade is deliberately minimal (`build` / `reset` / `add` / `getEntries`) — see
 * the parent issue's _Facade surface_ for why the extra `EmissionRegistry`-style read
 * helpers (`getEntryById`, `clear`, `counts`) are not reproduced here.
 * @author darthjee
 */
class MemoryRegistry {
  static #instance = null;

  /**
   * Creates and stores the singleton instance.
   * @param {object} [options={}] - Options.
   * @param {number} [options.retention] - Maximum number of memory readings to retain.
   * @returns {MemoryRegistryInstance} The created instance.
   * @throws {Error} If build() has already been called without a preceding reset().
   */
  static build({ retention } = {}) {
    if (MemoryRegistry.#instance) {
      throw new Error('MemoryRegistry.build() has already been called. Call reset() first.');
    }
    MemoryRegistry.#instance = new MemoryRegistryInstance({ retention });
    return MemoryRegistry.#instance;
  }

  /**
   * Destroys the singleton instance. Intended for test teardown.
   * @returns {void}
   */
  static reset() {
    MemoryRegistry.#instance = null;
  }

  /**
   * Records a new memory reading. No-ops when the registry has not been built.
   * @param {number} value - The raw RSS reading, in bytes.
   * @param {number} percentage - `value` as a percentage of the configured memory maximum.
   * @returns {void}
   */
  static add(value, percentage) {
    if (!MemoryRegistry.#instance) return;
    MemoryRegistry.#instance.add(value, percentage);
  }

  /**
   * Gets memory entries oldest-first, optionally filtered to entries newer than lastId.
   *
   * Consumer contract quirk: an empty array is returned both when the caller is
   * caught up *and* when its `lastId` has aged out of the retention window — see
   * {@link MemoryRegistryInstance#getEntries}.
   * @param {object} [options={}] - Query options.
   * @param {number|string} [options.lastId] - When provided, returns only entries newer than this ID.
   * @returns {Array<import('../utils/memory/MemoryData.js').MemoryData>} Array of entries, oldest-first.
   * @throws {Error} If build() has not been called.
   */
  static getEntries({ lastId } = {}) {
    return MemoryRegistry.#getInstance().getEntries({ lastId });
  }

  /**
   * Returns the singleton instance, throwing if not yet built.
   * @returns {MemoryRegistryInstance} The singleton instance.
   * @throws {Error} If build() has not been called.
   * @private
   */
  static #getInstance() {
    if (!MemoryRegistry.#instance) {
      throw new Error('MemoryRegistry has not been built. Call MemoryRegistry.build() first.');
    }
    return MemoryRegistry.#instance;
  }
}

export { MemoryRegistry };
