/**
 * LoggerGroup broadcasts log messages to multiple Logger instances.
 * Useful for sending the same log output to multiple destinations (console, web, file, etc.).
 * @author darthjee
 */
class LoggerGroup {
  #loggers;

  /**
   * Creates a new LoggerGroup instance.
   * @param {Array<Logger>} [loggers=[]] - Array of Logger instances to broadcast to.
   */
  constructor(loggers = []) {
    this.#loggers = loggers;
  }

  /**
   * Adds a logger to the group.
   * @param {Logger} logger - The Logger instance to add.
   * @returns {LoggerGroup} This instance for method chaining.
   */
  addLogger(logger) {
    this.#loggers.push(logger);
    return this;
  }

  /**
   * Removes a logger from the group.
   * @param {Logger} logger - The Logger instance to remove.
   * @returns {LoggerGroup} This instance for method chaining.
   */
  removeLogger(logger) {
    this.#loggers = this.#loggers.filter(l => l !== logger);
    return this;
  }

  /**
   * Returns all loggers in the group.
   * @returns {Array<Logger>} Array of Logger instances.
   */
  getLoggers() {
    return [...this.#loggers];
  }

  /**
   * Broadcasts a debug message to all loggers in the group.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  debug(message) {
    this.#loggers.forEach(logger => logger.debug(message));
  }

  /**
   * Broadcasts an info message to all loggers in the group.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  info(message) {
    this.#loggers.forEach(logger => logger.info(message));
  }

  /**
   * Broadcasts a warn message to all loggers in the group.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  warn(message) {
    this.#loggers.forEach(logger => logger.warn(message));
  }

  /**
   * Broadcasts an error message to all loggers in the group.
   * @param {string} message - The message to log.
   * @returns {void}
   */
  error(message) {
    this.#loggers.forEach(logger => logger.error(message));
  }

  /**
   * Suppresses or restores log output on all loggers in the group.
   * @param {boolean} [value=true] - When true, all log output is suppressed.
   * @returns {void}
   */
  suppress(value = true) {
    this.#loggers.forEach(logger => logger.suppress(value));
  }

  /**
   * Sets the log level threshold on all loggers in the group.
   * @param {string} level - The new log level ('debug', 'info', 'warn', 'error', 'silent').
   * @returns {void}
   */
  setLevel(level) {
    this.#loggers.forEach(logger => logger.setLevel(level));
  }
}

export { LoggerGroup };
