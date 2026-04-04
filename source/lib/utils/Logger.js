/**
 * Logger utility that filters log output based on a configurable level threshold.
 * @author darthjee
 */
class Logger {
  static #defaultInstance;

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
   * @param {string} level - The log level to check.
   * @returns {boolean} True if the message should be logged at the given level.
   */
  #shouldLog(level) {
    return this.#levels[level] >= this.#levels[this.#level];
  }

  /**
   * Logs a debug message if the configured level allows it.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  debug(message) {
    if (this.#shouldLog('debug')) console.debug(message); // eslint-disable-line no-console
  }

  /**
   * Logs an info message if the configured level allows it.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  info(message) {
    if (this.#shouldLog('info')) console.info(message); // eslint-disable-line no-console
  }

  /**
   * Logs a warn message if the configured level allows it.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  warn(message) {
    if (this.#shouldLog('warn')) console.warn(message); // eslint-disable-line no-console
  }

  /**
   * Logs an error message if the configured level allows it.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  error(message) {
    if (this.#shouldLog('error')) console.error(message); // eslint-disable-line no-console
  }

  /**
   * Returns the default Logger instance (singleton).
   * @returns {Logger} The default logger instance.
   */
  static default() {
    if (!this.#defaultInstance) {
      this.#defaultInstance = new Logger();
    }
    return this.#defaultInstance;
  }

  /**
   * Logs a debug message using the default logger instance.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  static debug(message) {
    this.default().debug(message);
  }

  /**
   * Logs an info message using the default logger instance.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  static info(message) {
    this.default().info(message);
  }

  /**
   * Logs a warn message using the default logger instance.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  static warn(message) {
    this.default().warn(message);
  }

  /**
   * Logs an error message using the default logger instance.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  static error(message) {
    this.default().error(message);
  }
}

export { Logger };
