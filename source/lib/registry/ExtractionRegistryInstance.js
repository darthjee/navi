import { ExtractionStore } from '../utils/extractions/ExtractionStore.js';
import { LogFilter } from '../utils/logging/LogFilter.js';

/**
 * Holds a single ExtractionStore for the ExtractionRegistry singleton. Exposes a write
 * helper (`recordExtraction`) and read helpers (`getRecords`, `getRecordById`, `counts`)
 * that delegate to the store. Not exported for direct use; accessed only via
 * ExtractionRegistry.
 * @author darthjee
 */
class ExtractionRegistryInstance {
  #store;

  /**
   * Creates a new ExtractionRegistryInstance.
   * @param {object} [options={}] - Options for the store.
   * @param {number} [options.retention] - Maximum number of extraction records to retain.
   */
  constructor({ retention } = {}) {
    this.#store = new ExtractionStore(retention);
  }

  /**
   * Returns the underlying ExtractionStore instance.
   * @returns {ExtractionStore} The underlying ExtractionStore instance.
   */
  get store() {
    return this.#store;
  }

  /**
   * Gets a shallow copy of the extraction counters.
   * @returns {{extracted: number}} The counters.
   */
  get counts() {
    return this.#store.counts;
  }

  /**
   * Records a new extraction.
   * @param {object} details - Extraction parameters forwarded to ExtractionStore.recordExtraction.
   * @returns {import('../utils/extractions/ExtractionRecord.js').ExtractionRecord} The created record.
   */
  recordExtraction(details) {
    return this.#store.recordExtraction(details);
  }

  /**
   * Gets extraction records oldest-first, optionally filtered to entries newer than lastId.
   * @param {object} [options={}] - Query options.
   * @param {number|string} [options.lastId] - When provided, returns only records newer than this ID.
   * @returns {Array<import('../utils/extractions/ExtractionRecord.js').ExtractionRecord>} Array of records.
   */
  getRecords({ lastId } = {}) {
    return new LogFilter(this.#store.getRecords()).filter({ lastId });
  }

  /**
   * Gets a specific extraction record by ID.
   * @param {number} id - The record ID to look up.
   * @returns {import('../utils/extractions/ExtractionRecord.js').ExtractionRecord|undefined} The record or undefined.
   */
  getRecordById(id) {
    return this.#store.getRecordById(id);
  }

  /**
   * Clears all extraction records and resets every counter.
   * @returns {void}
   */
  clear() {
    this.#store.clear();
  }
}

export { ExtractionRegistryInstance };
