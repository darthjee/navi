/**
 * Base logger that filters log output based on a configurable level threshold.
 * Subclasses must implement _output(level, message) to handle the actual output.
 * @author darthjee
 */
class BaseLogger {
  #level;
  #suppressed = false;
  #levels = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

  /**
   * Creates a new BaseLogger instance.
   * @param {string} [level] - The log level threshold. Defaults to the LOG_LEVEL env var or 'info'.
   */
  constructor(level) {
    this.#level = level ?? process.env.LOG_LEVEL ?? 'info';
  }

  /**
   * Outputs a message at the given level. Override in subclasses.
   * @param {string} _level - The log level.
   * @param {string} _message - The message to output.
   * @param {object} _attributes - The structured metadata for the log entry.
   * @returns {void}
   */
  _output(_level, _message, _attributes) {}

  /**
   * Logs a debug message if the configured level allows it.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  debug(message, attributes = {}) {
    if (this.#shouldLog('debug')) this._output('debug', message, attributes);
  }

  /**
   * Logs an info message if the configured level allows it.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  info(message, attributes = {}) {
    if (this.#shouldLog('info')) this._output('info', message, attributes);
  }

  /**
   * Logs a warn message if the configured level allows it.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  warn(message, attributes = {}) {
    if (this.#shouldLog('warn')) this._output('warn', message, attributes);
  }

  /**
   * Logs an error message if the configured level allows it.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  error(message, attributes = {}) {
    if (this.#shouldLog('error')) this._output('error', message, attributes);
  }

  /**
   * Suppresses or restores log output for this instance.
   * @param {boolean} [value=true] - When true, all log output is suppressed.
   * @returns {void}
   */
  suppress(value = true) {
    this.#suppressed = value;
  }

  /**
   * Sets the log level threshold for this instance.
   * @param {string} level - The new log level ('debug', 'info', 'warn', 'error', 'silent').
   * @returns {void}
   */
  setLevel(level) {
    if (!(level in this.#levels)) {
      throw new Error(`Invalid log level: "${level}". Must be one of: ${Object.keys(this.#levels).join(', ')}.`);
    }
    this.#level = level;
  }

  /**
   * @param {string} level - The log level to check.
   * @returns {boolean} True if the message should be logged at the given level.
   */
  #shouldLog(level) {
    return !this.#suppressed && this.#levels[level] >= this.#levels[this.#level];
  }
}

export { BaseLogger };
