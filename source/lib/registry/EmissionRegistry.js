import { EmissionRegistryInstance } from './EmissionRegistryInstance.js';

/**
 * EmissionRegistry is a static singleton facade for the application's EmitJob emission
 * tracking store.
 *
 * Call `EmissionRegistry.build(options)` once during application bootstrap.
 * Use `EmissionRegistry.reset()` in tests to restore a clean state between examples.
 *
 * Strictness is intentionally asymmetric: `build` and the read helpers (`getRecords`,
 * `getRecordById`, `counts`, `clear`) throw when the registry has not been built, while the
 * write helpers (`incExtracted`, `recordEmission`) silently no-op so that jobs can call
 * them unconditionally without every job spec having to build the registry.
 * @author darthjee
 */
class EmissionRegistry {
  static #instance = null;

  /**
   * Creates and stores the singleton instance.
   * @param {object} [options={}] - Forwarded to EmissionRegistryInstance constructor.
   * @returns {EmissionRegistryInstance} The created instance.
   * @throws {Error} If build() has already been called without a preceding reset().
   */
  static build(options = {}) {
    if (EmissionRegistry.#instance) {
      throw new Error('EmissionRegistry.build() has already been called. Call reset() first.');
    }
    EmissionRegistry.#instance = new EmissionRegistryInstance(options);
    return EmissionRegistry.#instance;
  }

  /**
   * Destroys the singleton instance. Intended for test teardown.
   * @returns {void}
   */
  static reset() {
    EmissionRegistry.#instance = null;
  }

  /**
   * Increments the extracted-items counter. No-ops when the registry has not been built.
   * @param {number} [n=1] - Number of extracted items to add.
   * @returns {void}
   */
  static incExtracted(n = 1) {
    if (!EmissionRegistry.#instance) return;
    EmissionRegistry.#instance.incExtracted(n);
  }

  /**
   * Records a new emission. No-ops when the registry has not been built.
   * @param {object} details - Emission parameters forwarded to the store.
   * @returns {void}
   */
  static recordEmission(details) {
    if (!EmissionRegistry.#instance) return;
    EmissionRegistry.#instance.recordEmission(details);
  }

  /**
   * Gets emission records oldest-first, optionally filtered to entries newer than lastId.
   * @param {object} [options={}] - Query options.
   * @param {number|string} [options.lastId] - When provided, returns only records newer than this ID.
   * @returns {Array<import('../utils/emissions/EmissionRecord.js').EmissionRecord>} Array of records.
   * @throws {Error} If build() has not been called.
   */
  static getRecords({ lastId } = {}) {
    return EmissionRegistry.#getInstance().getRecords({ lastId });
  }

  /**
   * Gets a specific emission record by ID.
   * @param {number} id - The record ID to look up.
   * @returns {import('../utils/emissions/EmissionRecord.js').EmissionRecord|undefined} The record or undefined.
   * @throws {Error} If build() has not been called.
   */
  static getRecordById(id) {
    return EmissionRegistry.#getInstance().getRecordById(id);
  }

  /**
   * Gets a shallow copy of the emission counters.
   * @returns {{extracted: number, emitted: number, failed: number, dead: number}} The counters.
   * @throws {Error} If build() has not been called.
   */
  static get counts() {
    return EmissionRegistry.#getInstance().counts;
  }

  /**
   * Clears all emission records and resets every counter.
   * @returns {void}
   * @throws {Error} If build() has not been called.
   */
  static clear() {
    EmissionRegistry.#getInstance().clear();
  }

  /**
   * Returns the singleton instance, throwing if not yet built.
   * @returns {EmissionRegistryInstance} The singleton instance.
   * @throws {Error} If build() has not been called.
   */
  static #getInstance() {
    if (!EmissionRegistry.#instance) {
      throw new Error('EmissionRegistry has not been built. Call EmissionRegistry.build() first.');
    }
    return EmissionRegistry.#instance;
  }
}

export { EmissionRegistry };
