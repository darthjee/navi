import { EmissionRecordFactory } from './EmissionRecordFactory.js';

/**
 * EmissionStore keeps a limited collection of EmitJob emission records with automatic
 * retention, plus monotonic counters that stay exact for the life of the run even after
 * old records are evicted.
 * @author darthjee
 */
class EmissionStore {
  #records;
  #retention;
  #factory;
  #counts;

  /**
   * Creates a new EmissionStore instance.
   * @param {number} [retention=100] - Maximum number of emission records to retain.
   */
  constructor(retention = 100) {
    this.#records = [];
    this.#retention = retention;
    this.#factory = new EmissionRecordFactory();
    this.#counts = { extracted: 0, emitted: 0, failed: 0, dead: 0 };
  }

  /**
   * Records a new emission, evicting the oldest record when retention is exceeded and
   * bumping the counter that matches the emission status.
   * @param {object} params - Emission parameters.
   * @param {string} params.status - The emission status (`success`, `failed` or `dead`).
   * @param {string} params.url - The URL the emission targeted.
   * @param {string} params.method - The HTTP method used for the emission.
   * @param {number|null} [params.httpStatus] - The HTTP response status, when available.
   * @param {string|null} [params.error] - The error message, when the emission failed.
   * @param {string|null} [params.itemRef] - A compact reference to the emitted item.
   * @returns {import('./EmissionRecord.js').EmissionRecord} The created emission record.
   */
  recordEmission({ status, url, method, httpStatus, error, itemRef }) {
    const record = this.#factory.build({ status, url, method, httpStatus, error, itemRef });

    this.#records.unshift(record);

    if (this.#records.length > this.#retention) {
      this.#records.pop();
    }

    if (status === 'success') {
      this.#counts.emitted += 1;
    } else if (status === 'failed') {
      this.#counts.failed += 1;
    } else if (status === 'dead') {
      this.#counts.dead += 1;
    }

    return record;
  }

  /**
   * Increments the extracted-items counter. No record is created.
   * @param {number} [n=1] - Number of extracted items to add.
   * @returns {void}
   */
  incExtracted(n = 1) {
    this.#counts.extracted += n;
  }

  /**
   * Gets all emission records, oldest-first.
   * @returns {Array<import('./EmissionRecord.js').EmissionRecord>} Array of emission records.
   */
  getRecords() {
    return [...this.#records].reverse();
  }

  /**
   * Gets a specific emission record by ID.
   * @param {number} id - The record ID to find.
   * @returns {import('./EmissionRecord.js').EmissionRecord|undefined} The record or undefined if not found.
   */
  getRecordById(id) {
    return this.#records.find(record => record.id === id);
  }

  /**
   * Clears all emission records and resets every counter to zero.
   * @returns {void}
   */
  clear() {
    this.#records = [];
    this.#counts = { extracted: 0, emitted: 0, failed: 0, dead: 0 };
  }

  /**
   * Gets the current number of emission records in the store.
   * @returns {number} The number of records.
   */
  get size() {
    return this.#records.length;
  }

  /**
   * Gets the retention limit.
   * @returns {number} The maximum number of records to retain.
   */
  get retention() {
    return this.#retention;
  }

  /**
   * Gets a shallow copy of the emission counters.
   * @returns {{extracted: number, emitted: number, failed: number, dead: number}} The counters.
   */
  get counts() {
    return { ...this.#counts };
  }

  /**
   * Converts the store to a plain object with counters and oldest-first records.
   * @returns {{counts: object, records: Array<object>}} Plain object representation of the store.
   */
  toJSON() {
    return {
      counts: this.counts,
      records: [...this.#records].reverse().map(record => record.toJSON())
    };
  }
}

export { EmissionStore };
