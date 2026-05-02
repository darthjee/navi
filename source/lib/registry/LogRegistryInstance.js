import { BufferedLogger } from '../utils/logging/BufferedLogger.js';
import { ConsoleLogger } from '../utils/logging/ConsoleLogger.js';
import { LogFilter } from '../utils/logging/LogFilter.js';
import { LoggerGroup } from '../utils/logging/LoggerGroup.js';

/**
 * Holds a LoggerGroup (ConsoleLogger + BufferedLogger) for the LogRegistry singleton.
 * Exposes debug/info/warn/error methods that fan out to both outputs, and filtered log
 * queries via LogFilter. Not exported directly; accessed only via LogRegistry.
 * @author darthjee
 */
class LogRegistryInstance {
  #bufferedLogger;
  #loggerGroup;

  /**
   * Creates a new LogRegistryInstance.
   * @param {object} [options={}] - Options for the loggers.
   * @param {string} [options.level] - Log level threshold.
   * @param {number} [options.retention=100] - Maximum number of logs to retain.
   */
  constructor({ level, retention } = {}) {
    this.#bufferedLogger = new BufferedLogger(level, retention);
    this.#loggerGroup = new LoggerGroup([new ConsoleLogger(level), this.#bufferedLogger]);
  }

  /**
   * Returns the underlying BufferedLogger instance.
   * @returns {BufferedLogger}
   */
  get bufferedLogger() {
    return this.#bufferedLogger;
  }

  /**
   * Logs a debug message to both the console and the buffer.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  debug(message, attributes = {}) {
    this.#loggerGroup.debug(message, attributes);
  }

  /**
   * Logs an error message to both the console and the buffer.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  error(message, attributes = {}) {
    this.#loggerGroup.error(message, attributes);
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

  /**
   * Logs an info message to both the console and the buffer.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  info(message, attributes = {}) {
    this.#loggerGroup.info(message, attributes);
  }

  /**
   * Logs a warn message to both the console and the buffer.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  warn(message, attributes = {}) {
    this.#loggerGroup.warn(message, attributes);
  }
}

export { LogRegistryInstance };
