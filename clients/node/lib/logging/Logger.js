import { ConsoleLogger } from './ConsoleLogger.js';

/**
 * Static facade for the default ConsoleLogger singleton.
 * All instance-level log logic lives in BaseLogger / ConsoleLogger.
 *
 * Unlike the engine's equivalent (`source/lib/common/utils/logging/Logger.js`),
 * this client-side port wraps a single `ConsoleLogger` directly instead of a
 * `LoggerGroup` — the client CLI only ever has one output sink (stdout/stderr),
 * so fan-out has no use case here.
 *
 * @example <caption>Basic logging</caption>
 * Logger.info('Server started');
 * Logger.warn('Low memory');
 * Logger.error('Request failed');
 *
 * @example <caption>Suppress all output</caption>
 * Logger.suppress();
 * Logger.info('This will not be printed');
 * Logger.suppress(false); // restore output
 *
 * @author darthjee
 */
class Logger {
  static #logger;

  /**
   * Returns the default ConsoleLogger instance (singleton).
   * Initialized with a ConsoleLogger on first access.
   * @returns {ConsoleLogger} The default logger instance.
   */
  static default() {
    this.#ensureLogger();
    return this.#logger;
  }

  /**
   * Logs a debug message using the default logger instance.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  static debug(message, attributes = {}) {
    this.default().debug(message, attributes);
  }

  /**
   * Logs an info message using the default logger instance.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  static info(message, attributes = {}) {
    this.default().info(message, attributes);
  }

  /**
   * Logs a warn message using the default logger instance.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  static warn(message, attributes = {}) {
    this.default().warn(message, attributes);
  }

  /**
   * Logs an error message using the default logger instance.
   * @param {string} message - The message to log.
   * @param {object} [attributes={}] - Optional structured metadata.
   * @returns {void}
   */
  static error(message, attributes = {}) {
    this.default().error(message, attributes);
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
   * Resets the default logger so a new one is created on the next call to default().
   * Useful in tests to ensure a clean singleton state.
   * @returns {void}
   */
  static reset() {
    this.#logger = null;
  }

  /**
   * Ensures the default ConsoleLogger instance exists, creating one if needed.
   * @returns {void}
   */
  static #ensureLogger() {
    if (!this.#logger) {
      this.#logger = new ConsoleLogger();
    }
  }
}

export { Logger };
