import { LogFilter } from '../utils/logging/LogFilter.js';
import { MemoryDataStore } from '../utils/memory/MemoryDataStore.js';

/**
 * Holds a single MemoryDataStore for the MemoryRegistry singleton. Exposes a write
 * helper (`add`) and a read helper (`getEntries`) that delegate to the store. Not
 * exported for direct use; accessed only via MemoryRegistry.
 * @author darthjee
 */
class MemoryRegistryInstance {
  #store;

  /**
   * Creates a new MemoryRegistryInstance.
   * @param {object} [options={}] - Options for the store.
   * @param {number} [options.retention] - Maximum number of memory readings to retain.
   */
  constructor({ retention } = {}) {
    this.#store = new MemoryDataStore(retention);
  }

  /**
   * Returns the underlying MemoryDataStore instance.
   * @returns {MemoryDataStore} The underlying MemoryDataStore instance.
   */
  get store() {
    return this.#store;
  }

  /**
   * Records a new memory reading.
   * @param {number} value - The raw RSS reading, in bytes.
   * @param {number} percentage - `value` as a percentage of the configured memory maximum.
   * @returns {import('../utils/memory/MemoryData.js').MemoryData} The created memory entry.
   */
  add(value, percentage) {
    return this.#store.add(value, percentage);
  }

  /**
   * Gets memory entries oldest-first, optionally filtered to entries newer than lastId.
   *
   * Consumer contract quirk: an empty array is returned both when the caller is
   * caught up *and* when its `lastId` has aged out of the retention window (older
   * than `size * interval`) — the two are indistinguishable from the return value
   * alone. Callers seeing a persistent empty response after a gap should reseed
   * from the full history.
   * @param {object} [options={}] - Query options.
   * @param {number|string} [options.lastId] - When provided, returns only entries newer than this ID.
   * @returns {Array<import('../utils/memory/MemoryData.js').MemoryData>} Array of entries, oldest-first.
   */
  getEntries({ lastId } = {}) {
    return new LogFilter(this.#store.getEntries()).filter({ lastId });
  }
}

export { MemoryRegistryInstance };
