import { ExtractionRecordFactory } from './ExtractionRecordFactory.js';

/**
 * ExtractionStore keeps a limited collection of ExtractionJob run records with automatic
 * retention, plus a monotonic extracted-items counter that stays exact for the life of the
 * run even after old records are evicted.
 * @author darthjee
 */
class ExtractionStore {
  #records;
  #retention;
  #factory;
  #counts;

  /**
   * Creates a new ExtractionStore instance.
   * @param {number} [retention=100] - Maximum number of extraction records to retain.
   */
  constructor(retention = 100) {
    this.#records = [];
    this.#retention = retention;
    this.#factory = new ExtractionRecordFactory();
    this.#counts = { extracted: 0 };
  }

  /**
   * Records a new extraction, evicting the oldest record when retention is exceeded and
   * adding its item count to the monotonic extracted counter.
   * @param {object} params - Extraction parameters.
   * @param {string} params.parserType - The parser type that produced the items.
   * @param {string|null} [params.originUrl] - The URL that triggered the extraction.
   * @param {number} [params.itemCount] - The number of items produced by the extraction.
   * @returns {import('./ExtractionRecord.js').ExtractionRecord} The created extraction record.
   */
  recordExtraction({ parserType, originUrl, itemCount }) {
    const record = this.#factory.build({ parserType, originUrl, itemCount });

    this.#records.unshift(record);

    if (this.#records.length > this.#retention) {
      this.#records.pop();
    }

    this.#counts.extracted += record.itemCount;

    return record;
  }

  /**
   * Gets all extraction records, oldest-first.
   * @returns {Array<import('./ExtractionRecord.js').ExtractionRecord>} Array of extraction records.
   */
  getRecords() {
    return [...this.#records].reverse();
  }

  /**
   * Gets a specific extraction record by ID.
   * @param {number} id - The record ID to find.
   * @returns {import('./ExtractionRecord.js').ExtractionRecord|undefined} The record or undefined if not found.
   */
  getRecordById(id) {
    return this.#records.find(record => record.id === id);
  }

  /**
   * Clears all extraction records and resets the extracted counter to zero.
   * @returns {void}
   */
  clear() {
    this.#records = [];
    this.#counts = { extracted: 0 };
  }

  /**
   * Gets the current number of extraction records in the store.
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
   * Gets a shallow copy of the extraction counters.
   * @returns {{extracted: number}} The counters.
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

export { ExtractionStore };
