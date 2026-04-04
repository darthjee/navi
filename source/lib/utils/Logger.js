/**
 * Logger utility that filters log output based on a configurable level threshold.
 * @author darthjee
 */
class Logger {
  static #defaultInstance;

  #level;
  #suppressed = false;
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
    return !this.#suppressed && this.#levels[level] >= this.#levels[this.#level];
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

  /**
   * Suppresses or restores log output on the default logger instance.
   * @param {boolean} [value=true] - When true, all log output is suppressed.
   * @returns {void}
   */
  static suppress(value = true) {
    this.default().suppress(value);
  }

  /**
   * Sets the log level threshold on the default logger instance.
   * @param {string} level - The new log level ('debug', 'info', 'warn', 'error', 'silent').
   * @returns {void}
   */
  static setLevel(level) {
    this.default().setLevel(level);
  }

  /**
   * Resets the default Logger instance so a new one is created on the next call to default().
   * Useful in tests to ensure a clean singleton state.
   * @returns {void}
   */
  static reset() {
    this.#defaultInstance = null;
  }

  /**
   * Sets the default Logger instance to the provided logger.
   * Useful in tests to inject a mock or custom logger.
   * @param {Logger} newLogger - The logger instance to use as the default.
   * @returns {void}
   */
  static setDefault(newLogger) {
    this.#defaultInstance = newLogger;
  }
}

export { Logger };
