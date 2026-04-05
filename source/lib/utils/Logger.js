import { ConsoleLogger } from './ConsoleLogger.js';

/**
 * Static facade for the default ConsoleLogger singleton.
 * All instance-level log logic lives in BaseLogger / ConsoleLogger.
 * @author darthjee
 */
class Logger {
  static #defaultInstance;

  /**
   * Returns the default ConsoleLogger instance (singleton).
   * @returns {ConsoleLogger} The default logger instance.
   */
  static default() {
    if (!this.#defaultInstance) {
      this.#defaultInstance = new ConsoleLogger();
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
   * Resets the default logger instance so a new one is created on the next call to default().
   * Useful in tests to ensure a clean singleton state.
   * @returns {void}
   */
  static reset() {
    this.#defaultInstance = null;
  }

  /**
   * Sets the default logger instance to the provided logger.
   * Useful in tests to inject a mock or custom logger.
   * @param {ConsoleLogger} newLogger - The logger instance to use as the default.
   * @returns {void}
   */
  static setDefault(newLogger) {
    this.#defaultInstance = newLogger;
  }
}

export { Logger };
