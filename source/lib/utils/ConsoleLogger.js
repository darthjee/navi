import { BaseLogger } from './BaseLogger.js';

/**
 * Logger that writes output to the browser/Node.js console.
 * @author darthjee
 */
class ConsoleLogger extends BaseLogger {
  /**
   * Writes a message to the console at the given level.
   * @param {string} level - One of 'debug', 'info', 'warn', 'error'.
   * @param {string} message - The message to output.
   * @returns {void}
   */
  _output(level, message) {
    console[level](message); // eslint-disable-line no-console
  }
}

export { ConsoleLogger };
