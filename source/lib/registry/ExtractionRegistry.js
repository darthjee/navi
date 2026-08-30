import { ExtractionRegistryInstance } from './ExtractionRegistryInstance.js';

/**
 * ExtractionRegistry is a static singleton facade for the application's ExtractionJob
 * run tracking store.
 *
 * Call `ExtractionRegistry.build(options)` once during application bootstrap.
 * Use `ExtractionRegistry.reset()` in tests to restore a clean state between examples.
 *
 * Strictness is intentionally asymmetric: `build` and the read helpers (`getRecords`,
 * `getRecordById`, `counts`, `clear`) throw when the registry has not been built, while the
 * write helper (`recordExtraction`) silently no-ops so that jobs can call it
 * unconditionally without every job spec having to build the registry.
 * @author darthjee
 */
class ExtractionRegistry {
  static #instance = null;

  /**
   * Creates and stores the singleton instance.
   * @param {object} [options={}] - Forwarded to ExtractionRegistryInstance constructor.
   * @returns {ExtractionRegistryInstance} The created instance.
   * @throws {Error} If build() has already been called without a preceding reset().
   */
  static build(options = {}) {
    if (ExtractionRegistry.#instance) {
      throw new Error('ExtractionRegistry.build() has already been called. Call reset() first.');
    }
    ExtractionRegistry.#instance = new ExtractionRegistryInstance(options);
    return ExtractionRegistry.#instance;
  }

  /**
   * Destroys the singleton instance. Intended for test teardown.
   * @returns {void}
   */
  static reset() {
    ExtractionRegistry.#instance = null;
  }

  /**
   * Records a new extraction. No-ops when the registry has not been built.
   * @param {object} details - Extraction parameters forwarded to the store.
   * @returns {import('../utils/extractions/ExtractionRecord.js').ExtractionRecord|undefined} The created record, or undefined when not built.
   */
  static recordExtraction(details) {
    if (!ExtractionRegistry.#instance) return undefined;
    return ExtractionRegistry.#instance.recordExtraction(details);
  }

  /**
   * Gets extraction records oldest-first, optionally filtered to entries newer than lastId.
   * @param {object} [options={}] - Query options.
   * @param {number|string} [options.lastId] - When provided, returns only records newer than this ID.
   * @returns {Array<import('../utils/extractions/ExtractionRecord.js').ExtractionRecord>} Array of records.
   * @throws {Error} If build() has not been called.
   */
  static getRecords({ lastId } = {}) {
    return ExtractionRegistry.#getInstance().getRecords({ lastId });
  }

  /**
   * Gets a specific extraction record by ID.
   * @param {number} id - The record ID to look up.
   * @returns {import('../utils/extractions/ExtractionRecord.js').ExtractionRecord|undefined} The record or undefined.
   * @throws {Error} If build() has not been called.
   */
  static getRecordById(id) {
    return ExtractionRegistry.#getInstance().getRecordById(id);
  }

  /**
   * Gets a shallow copy of the extraction counters.
   * @returns {{extracted: number}} The counters.
   * @throws {Error} If build() has not been called.
   */
  static get counts() {
    return ExtractionRegistry.#getInstance().counts;
  }

  /**
   * Clears all extraction records and resets every counter.
   * @returns {void}
   * @throws {Error} If build() has not been called.
   */
  static clear() {
    ExtractionRegistry.#getInstance().clear();
  }

  /**
   * Returns the singleton instance, throwing if not yet built.
   * @returns {ExtractionRegistryInstance} The singleton instance.
   * @throws {Error} If build() has not been called.
   */
  static #getInstance() {
    if (!ExtractionRegistry.#instance) {
      throw new Error('ExtractionRegistry has not been built. Call ExtractionRegistry.build() first.');
    }
    return ExtractionRegistry.#instance;
  }
}

export { ExtractionRegistry };
