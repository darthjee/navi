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
   * @param {number} id - The log entry ID to look up.
   * @returns {import('../utils/logging/Log.js').Log|undefined} The matching log entry, or undefined if not found.
   */
  static getLogById(id) {
    return LogRegistry.#getInstance().getLogById(id);
  }

  /**
   * Gets logs in chronological order (oldest first), optionally filtered to entries newer than lastId.
   * @param {object} [options={}] - Query options.
   * @param {number|string} [options.lastId] - When provided, returns only logs newer than this ID.
   *   Returns an empty array if the ID is not found.
   * @returns {Array<import('../utils/logging/Log.js').Log>} Array of log entries.
   */
  static getLogs({ lastId } = {}) {
    return LogRegistry.#getInstance().getLogs({ lastId });
  }

  /**
   * Gets logs stored in the per-job buffer for the given job ID,
   * optionally filtered to entries newer than lastId.
   * @param {string|number} jobId - The job ID to look up logs for.
   * @param {object} [options={}] - Query options.
   * @param {number|string} [options.lastId] - When provided, returns only logs newer than this ID.
   * @returns {Array<import('../utils/logging/Log.js').Log>} Array of log entries.
   */
  static getLogsByJobId(jobId, { lastId } = {}) {
    return LogRegistry.#getInstance().getLogsByJobId(jobId, { lastId });
  }

  /**
   * Gets logs stored in the per-worker buffer for the given worker ID.
   * @param {string|number} workerId - The worker ID to look up logs for.
   * @returns {Array<import('../utils/logging/Log.js').Log>} Array of log entries.
   */
  static getLogsByWorkerId(workerId) {
    return LogRegistry.#getInstance().getLogsByWorkerId(workerId);
  }

  /**
   * Gets logs filtered by level.
   * @param {string} level - The log level to filter by.
   * @returns {Array<import('../utils/logging/Log.js').Log>} Array of log entries matching the level.
   */
  static getLogsByLevel(level) {
    return LogRegistry.#getInstance().getLogsByLevel(level);
  }

  /**
   * Returns all logs as plain JSON objects.
   * @returns {Array<object>} Array of plain log objects.
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
   * @returns {LogRegistryInstance} The singleton instance.
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
