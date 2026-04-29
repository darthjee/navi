import { LogFactory } from './LogFactory.js';

/**
 * LogBuffer manages a limited collection of log entries with automatic retention.
 * When the retention limit is reached, the oldest logs are automatically discarded.
 * @author darthjee
 */
class LogBuffer {
  #logs;
  #retention;
  #factory;

  /**
   * Creates a new LogBuffer instance.
   * @param {number} [retention=100] - Maximum number of logs to retain.
   */
  constructor(retention = 100) {
    this.#logs = [];
    this.#retention = retention;
    this.#factory = new LogFactory();
  }

  /**
   * Adds a new log entry to the buffer.
   * If retention limit is reached, removes the oldest log.
   * @param {string} level - The log level.
   * @param {string} message - The log message.
   * @param {object} [attributes={}] - Optional structured metadata for the log entry.
   * @returns {import('./Log.js').Log} The created log entry.
   */
  add(level, message, attributes = {}) {
    const log = this.#factory.build(level, message, attributes);

    this.#logs.unshift(log);

    if (this.#logs.length > this.#retention) {
      this.#logs.pop();
    }

    return log;
  }

  /**
   * Gets all logs in the buffer.
   * @returns {Array<Log>} Array of log entries.
   */
  getLogs() {
    return [...this.#logs].reverse();
  }

  /**
   * Gets a specific log by ID.
   * @param {number} id - The log ID to find.
   * @returns {Log|undefined} The log entry or undefined if not found.
   */
  getLogById(id) {
    return this.#logs.find(log => log.id === id);
  }

  /**
   * Gets logs filtered by level.
   * @param {string} level - The log level to filter by.
   * @returns {Array<Log>} Array of log entries matching the level.
   */
  getLogsByLevel(level) {
    return this.#logs.filter(log => log.level === level).reverse();
  }

  /**
   * Clears all logs from the buffer.
   * @returns {void}
   */
  clear() {
    this.#logs = [];
  }

  /**
   * Gets the current number of logs in the buffer.
   * @returns {number} The number of logs.
   */
  get size() {
    return this.#logs.length;
  }

  /**
   * Gets the retention limit.
   * @returns {number} The maximum number of logs to retain.
   */
  get retention() {
    return this.#retention;
  }

  /**
   * Converts all logs to JSON array.
   * @returns {Array<object>} Array of log objects.
   */
  toJSON() {
    return [...this.#logs].reverse().map(log => log.toJSON());
  }
}

export { LogBuffer };
