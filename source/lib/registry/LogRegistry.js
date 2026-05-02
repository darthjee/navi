import { LogRegistryInstance } from './LogRegistryInstance.js';

/**
 * LogRegistry is a static singleton facade for the application's buffered log publisher.
 *
 * Call `LogRegistry.build(options)` once during application bootstrap.
 * Use `LogRegistry.reset()` in tests to restore a clean state between examples.
 * @author darthjee
 */
class LogRegistry {
  static #instance = null;

  /**
   * Creates and stores the singleton instance.
   * @param {object} [options={}] - Forwarded to LogRegistryInstance constructor.
   * @returns {LogRegistryInstance} The created instance.
   * @throws {Error} If build() has already been called without a preceding reset().
   */
  static build(options = {}) {
    if (LogRegistry.#instance) {
      throw new Error('LogRegistry.build() has already been called. Call reset() first.');
    }
    LogRegistry.#instance = new LogRegistryInstance(options);
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
   * Logs a debug message to both the console and the API buffer.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  static debug(message, attributes = {}) {
    LogRegistry.#getInstance().debug(message, attributes);
  }

  /**
   * Logs an error message to both the console and the API buffer.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  static error(message, attributes = {}) {
    LogRegistry.#getInstance().error(message, attributes);
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
   * Logs an info message to both the console and the API buffer.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  static info(message, attributes = {}) {
    LogRegistry.#getInstance().info(message, attributes);
  }

  /**
   * Logs a warn message to both the console and the API buffer.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  static warn(message, attributes = {}) {
    LogRegistry.#getInstance().warn(message, attributes);
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
