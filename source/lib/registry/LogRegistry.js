import { Logger } from '../utils/logging/Logger.js';
import { LogRegistryInstance } from './LogRegistryInstance.js';

/**
 * LogRegistry is a static singleton facade for the application's BufferedLogger.
 *
 * Call `LogRegistry.build(options)` once during application bootstrap.
 * Use `LogRegistry.reset()` in tests to restore a clean state between examples.
 * @author darthjee
 */
class LogRegistry {
  static #instance = null;

  /**
   * Creates and stores the singleton instance, and wires the BufferedLogger into Logger.
   * @param {object} [options={}] - Forwarded to LogRegistryInstance constructor.
   * @returns {LogRegistryInstance} The created instance.
   * @throws {Error} If build() has already been called without a preceding reset().
   */
  static build(options = {}) {
    if (LogRegistry.#instance) {
      throw new Error('LogRegistry.build() has already been called. Call reset() first.');
    }
    LogRegistry.#instance = new LogRegistryInstance(options);
    Logger.addLogger(LogRegistry.#instance.bufferedLogger);
    return LogRegistry.#instance;
  }

  /**
   * Destroys the singleton instance. Intended for test teardown.
   * @returns {void}
   */
  static reset() {
    LogRegistry.#instance = null;
  }

  /**
   * Gets logs in chronological order (oldest first), optionally filtered to entries newer than lastId.
   * @param {object} [options={}]
   * @param {number|string} [options.lastId] - When provided, returns only logs newer than this ID.
   *   Returns an empty array if the ID is not found.
   * @returns {Array<import('../utils/logging/Log.js').Log>}
   */
  static getLogs({ lastId } = {}) {
    return LogRegistry.#getInstance().getLogs({ lastId });
  }

  /**
   * Gets a specific log by ID.
   * @param {number} id
   * @returns {import('../utils/logging/Log.js').Log|undefined}
   */
  static getLogById(id) {
    return LogRegistry.#getInstance().getLogById(id);
  }

  /**
   * Gets logs filtered by level.
   * @param {string} level
   * @returns {Array<import('../utils/logging/Log.js').Log>}
   */
  static getLogsByLevel(level) {
    return LogRegistry.#getInstance().getLogsByLevel(level);
  }

  /**
   * Returns all logs as plain JSON objects.
   * @returns {Array<object>}
   */
  static getLogsJSON() {
    return LogRegistry.#getInstance().getLogsJSON();
  }

  /**
   * Returns the singleton instance, throwing if not yet built.
   * @returns {LogRegistryInstance}
   * @throws {Error} If build() has not been called.
   */
  static #getInstance() {
    if (!LogRegistry.#instance) {
      throw new Error('LogRegistry has not been built. Call LogRegistry.build() first.');
    }
    return LogRegistry.#instance;
  }
}

export { LogRegistry };
