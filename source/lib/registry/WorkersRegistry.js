import { WorkersRegistryInstance } from './WorkersRegistryInstance.js';

/**
 * WorkersRegistry is a static singleton facade for managing the application's worker pool.
 *
 * Call `WorkersRegistry.build(options)` once during application bootstrap.
 * Use `WorkersRegistry.reset()` in tests to restore a clean state between examples.
 * @author darthjee
 */
class WorkersRegistry {
  static #instance = null;

  /**
   * Creates and stores the singleton instance.
   * @param {object} [options={}] - Forwarded to `WorkersRegistryInstance` constructor.
   * @returns {WorkersRegistryInstance} The created instance.
   * @throws {Error} If `build()` has already been called without a preceding `reset()`.
   */
  static build(options = {}) {
    if (WorkersRegistry.#instance) {
      throw new Error('WorkersRegistry.build() has already been called. Call reset() first.');
    }
    WorkersRegistry.#instance = new WorkersRegistryInstance(options);
    return WorkersRegistry.#instance;
  }

  /**
   * Destroys the singleton instance. Intended for test teardown.
   * @returns {void}
   */
  static reset() {
    WorkersRegistry.#instance = null;
  }

  /**
   * Initializes the specified number of workers.
   * @returns {void}
   */
  static initWorkers() {
    return WorkersRegistry.#getInstance().initWorkers();
  }

  /**
   * Sets a worker as busy.
   * @param {string} id - The ID of the worker to set as busy.
   * @returns {void}
   */
  static setBusy(id) {
    return WorkersRegistry.#getInstance().setBusy(id);
  }

  /**
   * Sets a worker as idle.
   * @param {string} id - The ID of the worker to set as idle.
   * @returns {void}
   */
  static setIdle(id) {
    return WorkersRegistry.#getInstance().setIdle(id);
  }

  /**
   * Checks if there is at least one busy worker.
   * @returns {boolean} True if there is at least one busy worker, false otherwise.
   */
  static hasBusyWorker() {
    return WorkersRegistry.#getInstance().hasBusyWorker();
  }

  /**
   * Checks if there is at least one idle worker.
   * @returns {boolean} True if there is at least one idle worker, false otherwise.
   */
  static hasIdleWorker() {
    return WorkersRegistry.#getInstance().hasIdleWorker();
  }

  /**
   * Gets an idle worker if available.
   * @returns {Worker|null} An idle worker if available, or null if no idle workers are present.
   */
  static getIdleWorker() {
    return WorkersRegistry.#getInstance().getIdleWorker();
  }

  /**
   * Returns counts of workers in each state.
   * @returns {{ idle: number, busy: number }} Counts of workers in each state.
   */
  static stats() {
    return WorkersRegistry.#getInstance().stats();
  }

  /**
   * Returns the singleton instance, throwing if not yet built.
   * @returns {WorkersRegistryInstance} The singleton instance.
   * @throws {Error} If `build()` has not been called.
   */
  static #getInstance() {
    if (!WorkersRegistry.#instance) {
      throw new Error('WorkersRegistry has not been built. Call WorkersRegistry.build() first.');
    }
    return WorkersRegistry.#instance;
  }
}

export { WorkersRegistry };
