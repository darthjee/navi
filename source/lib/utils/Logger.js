import { ConsoleLogger } from './ConsoleLogger.js';
import { LoggerGroup } from './LoggerGroup.js';

/**
 * Static facade for the default LoggerGroup singleton.
 * All instance-level log logic lives in BaseLogger / ConsoleLogger / LoggerGroup.
 *
 * @example <caption>Basic logging (default ConsoleLogger)</caption>
 * Logger.info('Server started');
 * Logger.warn('Low memory');
 * Logger.error('Request failed');
 *
 * @example <caption>Swap to a custom logger</caption>
 * Logger.setLogger(myCustomLogger);
 * Logger.info('Now routed through myCustomLogger');
 *
 * @example <caption>Add an extra log destination</caption>
 * const buffered = new BufferedLogger();
 * Logger.addLogger(buffered);
 * Logger.info('Goes to console and buffered logger');
 *
 * @example <caption>Suppress all output</caption>
 * Logger.suppress();
 * Logger.info('This will not be printed');
 * Logger.suppress(false); // restore output
 *
 * @author darthjee
 */
class Logger {
  static #loggerGroup;

  /**
   * Ensures the default LoggerGroup instance exists, creating one with a ConsoleLogger if needed.
   * @returns {void}
   */
  static #ensureLoggerGroup() {
    if (!this.#loggerGroup) {
      this.#loggerGroup = new LoggerGroup([new ConsoleLogger()]);
    }
  }

  /**
   * Returns the default LoggerGroup instance (singleton).
   * Initialized with a ConsoleLogger on first access.
   * @returns {LoggerGroup} The default logger group instance.
   */
  static default() {
    this.#ensureLoggerGroup();
    return this.#loggerGroup;
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
   * Resets the default logger group so a new one is created on the next call to default().
   * Useful in tests to ensure a clean singleton state.
   * @returns {void}
   */
  static reset() {
    this.#loggerGroup = null;
  }

  /**
   * Sets the default logger group to the provided instance.
   * Useful in tests to inject a mock or custom logger group.
   * @param {LoggerGroup} newLoggerGroup - The logger group instance to use as the default.
   * @returns {void}
   */
  static setDefault(newLoggerGroup) {
    this.#loggerGroup = newLoggerGroup;
  }

  /**
   * Replaces the default logger group with a new LoggerGroup containing the provided logger.
   * @param {object} logger - The logger instance to use in the new group.
   * @returns {void}
   */
  static setLogger(logger) {
    this.#loggerGroup = new LoggerGroup([logger]);
  }

  /**
   * Adds a logger to the default logger group.
   * @param {object} logger - The logger instance to add.
   * @returns {void}
   */
  static addLogger(logger) {
    this.default().addLogger(logger);
  }
}

export { Logger };
