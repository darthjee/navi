import { EmissionStore } from '../utils/emissions/EmissionStore.js';
import { LogFilter } from '../utils/logging/LogFilter.js';

/**
 * Holds a single EmissionStore for the EmissionRegistry singleton. Exposes write helpers
 * (`incExtracted`, `recordEmission`) and read helpers (`getRecords`, `getRecordById`,
 * `counts`) that delegate to the store. Not exported for direct use; accessed only via
 * EmissionRegistry.
 * @author darthjee
 */
class EmissionRegistryInstance {
  #store;

  /**
   * Creates a new EmissionRegistryInstance.
   * @param {object} [options={}] - Options for the store.
   * @param {number} [options.retention] - Maximum number of emission records to retain.
   */
  constructor({ retention } = {}) {
    this.#store = new EmissionStore(retention);
  }

  /**
   * Returns the underlying EmissionStore instance.
   * @returns {EmissionStore} The underlying EmissionStore instance.
   */
  get store() {
    return this.#store;
  }

  /**
   * Gets a shallow copy of the emission counters.
   * @returns {{extracted: number, emitted: number, failed: number, dead: number}} The counters.
   */
  get counts() {
    return this.#store.counts;
  }

  /**
   * Increments the extracted-items counter.
   * @param {number} [n=1] - Number of extracted items to add.
   * @returns {void}
   */
  incExtracted(n = 1) {
    this.#store.incExtracted(n);
  }

  /**
   * Records a new emission.
   * @param {object} details - Emission parameters forwarded to EmissionStore.recordEmission.
   * @returns {import('../utils/emissions/EmissionRecord.js').EmissionRecord} The created record.
   */
  recordEmission(details) {
    return this.#store.recordEmission(details);
  }

  /**
   * Gets emission records oldest-first, optionally filtered to entries newer than lastId.
   * @param {object} [options={}] - Query options.
   * @param {number|string} [options.lastId] - When provided, returns only records newer than this ID.
   * @returns {Array<import('../utils/emissions/EmissionRecord.js').EmissionRecord>} Array of records.
   */
  getRecords({ lastId } = {}) {
    return new LogFilter(this.#store.getRecords()).filter({ lastId });
  }

  /**
   * Gets a specific emission record by ID.
   * @param {number} id - The record ID to look up.
   * @returns {import('../utils/emissions/EmissionRecord.js').EmissionRecord|undefined} The record or undefined.
   */
  getRecordById(id) {
    return this.#store.getRecordById(id);
  }

  /**
   * Clears all emission records and resets every counter.
   * @returns {void}
   */
  clear() {
    this.#store.clear();
  }
}

export { EmissionRegistryInstance };
