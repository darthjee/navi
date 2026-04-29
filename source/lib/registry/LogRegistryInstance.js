import { BufferedLogger } from '../utils/logging/BufferedLogger.js';
import { LogFilter } from '../utils/logging/LogFilter.js';

/**
 * Holds the BufferedLogger instance for the LogRegistry singleton.
 * Not exported directly; accessed only via LogRegistry.
 * @author darthjee
 */
class LogRegistryInstance {
  #bufferedLogger;

  /**
   * Creates a new LogRegistryInstance.
   * @param {object} [options={}] - Options for the BufferedLogger.
   * @param {string} [options.level] - Log level threshold.
   * @param {number} [options.retention=100] - Maximum number of logs to retain.
   */
  constructor({ level, retention } = {}) {
    this.#bufferedLogger = new BufferedLogger(level, retention);
  }

  /**
   * Returns the underlying BufferedLogger instance.
   * @returns {BufferedLogger}
   */
  get bufferedLogger() {
    return this.#bufferedLogger;
  }

  /**
   * Gets logs in chronological order (oldest first), optionally filtered to entries newer than lastId.
   * @param {object} [options={}]
   * @param {number|string} [options.lastId] - When provided, returns only logs newer than this ID.
   *   Returns an empty array if the ID is not found.
   * @returns {Array<import('../utils/logging/Log.js').Log>}
   */
  getLogs({ lastId } = {}) {
    return new LogFilter(this.#bufferedLogger.getLogs()).filter({ lastId });
  }

  /**
   * Gets a specific log by ID.
   * @param {number} id
   * @returns {import('../utils/logging/Log.js').Log|undefined}
   */
  getLogById(id) {
    return this.#bufferedLogger.getLogById(id);
  }

  /**
   * Gets logs filtered by level.
   * @param {string} level
   * @returns {Array<import('../utils/logging/Log.js').Log>}
   */
  getLogsByLevel(level) {
    return this.#bufferedLogger.getLogsByLevel(level);
  }

  /**
   * Returns all logs as plain JSON objects.
   * @returns {Array<object>}
   */
  getLogsJSON() {
    return this.#bufferedLogger.getLogsJSON();
  }
}

export { LogRegistryInstance };
