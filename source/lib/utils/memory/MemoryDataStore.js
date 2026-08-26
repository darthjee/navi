import { MemoryDataFactory } from './MemoryDataFactory.js';

/**
 * MemoryDataStore manages a limited collection of memory readings with automatic retention.
 * When the retention limit is reached, the oldest entries are automatically discarded.
 * @author darthjee
 */
class MemoryDataStore {
  #entries;
  #retention;
  #factory;

  /**
   * Creates a new MemoryDataStore instance.
   * @param {number} [retention=100] - Maximum number of entries to retain.
   */
  constructor(retention = 100) {
    this.#entries = [];
    this.#retention = retention;
    this.#factory = new MemoryDataFactory();
  }

  /**
   * Adds a new memory reading to the store.
   * If retention limit is reached, removes the oldest entry.
   * @param {number} value - The raw RSS reading, in bytes.
   * @param {number} percentage - `value` as a percentage of the configured memory maximum.
   * @returns {import('./MemoryData.js').MemoryData} The created memory entry.
   */
  add(value, percentage) {
    const entry = this.#factory.build(value, percentage);

    this.#entries.unshift(entry);

    if (this.#entries.length > this.#retention) {
      this.#entries.pop();
    }

    return entry;
  }

  /**
   * Gets all entries in the store.
   * @returns {Array<MemoryData>} Array of memory entries.
   */
  getEntries() {
    return [...this.#entries].reverse();
  }

  /**
   * Gets a specific entry by ID.
   * @param {number} id - The entry ID to find.
   * @returns {MemoryData|undefined} The entry or undefined if not found.
   */
  getEntryById(id) {
    return this.#entries.find(entry => entry.id === id);
  }

  /**
   * Clears all entries from the store.
   * @returns {void}
   */
  clear() {
    this.#entries = [];
  }

  /**
   * Gets the current number of entries in the store.
   * @returns {number} The number of entries.
   */
  get size() {
    return this.#entries.length;
  }

  /**
   * Gets the retention limit.
   * @returns {number} The maximum number of entries to retain.
   */
  get retention() {
    return this.#retention;
  }

  /**
   * Converts all entries to JSON array.
   * @returns {Array<object>} Array of memory entry objects.
   */
  toJSON() {
    return [...this.#entries].reverse().map(entry => entry.toJSON());
  }
}

export { MemoryDataStore };
