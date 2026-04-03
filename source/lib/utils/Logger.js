/**
 * Logger utility that filters log output based on a configurable level threshold.
 * @author darthjee
 */
class Logger {
  #level;
  #levels = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

  /**
   * Creates a new Logger instance.
   * @param {string} [level] - The log level threshold. Defaults to the LOG_LEVEL env var or 'info'.
   */
  constructor(level) {
    this.#level = level ?? process.env.LOG_LEVEL ?? 'info';
  }

  /**
   * @param {string} level
   * @returns {boolean}
   */
  #shouldLog(level) {
    return this.#levels[level] >= this.#levels[this.#level];
  }

  /**
   * Logs a debug message if the configured level allows it.
   * @param {string} message
   * @returns {void}
   */
  debug(message) {
    if (this.#shouldLog('debug')) console.debug(message);
  }

  /**
   * Logs an info message if the configured level allows it.
   * @param {string} message
   * @returns {void}
   */
  info(message) {
    if (this.#shouldLog('info')) console.info(message);
  }

  /**
   * Logs a warn message if the configured level allows it.
   * @param {string} message
   * @returns {void}
   */
  warn(message) {
    if (this.#shouldLog('warn')) console.warn(message);
  }

  /**
   * Logs an error message if the configured level allows it.
   * @param {string} message
   * @returns {void}
   */
  error(message) {
    if (this.#shouldLog('error')) console.error(message);
  }
}

export { Logger };
