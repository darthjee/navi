import { Logger } from './Logger.js';
import { LogBuffer } from './LogBuffer.js';

/**
 * BufferedLogger extends Logger functionality by maintaining a history of log messages.
 * Useful for displaying logs in a web interface or debugging.
 * @author darthjee
 */
class BufferedLogger extends Logger {
  #buffer;

  /**
   * Creates a new BufferedLogger instance.
   * @param {string} [level] - The log level threshold.
   * @param {number} [retention=100] - Maximum number of logs to retain in buffer.
   */
  constructor(level, retention = 100) {
    super(level);
    this.#buffer = new LogBuffer(retention);
  }

  /**
   * Logs a debug message and stores it in the buffer.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  debug(message) {
    super.debug(message);
    this.#buffer.add('debug', message);
  }

  /**
   * Logs an info message and stores it in the buffer.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  info(message) {
    super.info(message);
    this.#buffer.add('info', message);
  }

  /**
   * Logs a warn message and stores it in the buffer.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  warn(message) {
    super.warn(message);
    this.#buffer.add('warn', message);
  }

  /**
   * Logs an error message and stores it in the buffer.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  error(message) {
    super.error(message);
    this.#buffer.add('error', message);
  }

  /**
   * Gets all logs from the buffer.
   * @returns {Array<import('./Log.js').Log>} Array of log entries.
   */
  getLogs() {
    return this.#buffer.getLogs();
  }

  /**
   * Gets a specific log by ID.
   * @param {number} id - The log ID to find.
   * @returns {import('./Log.js').Log|undefined} The log entry or undefined if not found.
   */
  getLogById(id) {
    return this.#buffer.getLogById(id);
  }

  /**
   * Gets logs filtered by level.
   * @param {string} level - The log level to filter by.
   * @returns {Array<import('./Log.js').Log>} Array of log entries matching the level.
   */
  getLogsByLevel(level) {
    return this.#buffer.getLogsByLevel(level);
  }

  /**
   * Clears all logs from the buffer.
   * @returns {void}
   */
  clearLogs() {
    this.#buffer.clear();
  }

  /**
   * Gets the current number of logs in the buffer.
   * @returns {number} The number of logs.
   */
  get bufferSize() {
    return this.#buffer.size;
  }

  /**
   * Gets the retention limit.
   * @returns {number} The maximum number of logs to retain.
   */
  get retention() {
    return this.#buffer.retention;
  }

  /**
   * Converts all logs to JSON array.
   * @returns {Array<object>} Array of log objects.
   */
  getLogsJSON() {
    return this.#buffer.toJSON();
  }
}

export { BufferedLogger };
