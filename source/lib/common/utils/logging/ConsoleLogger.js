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
   * @param {object} [attributes={}] - Optional structured metadata to output alongside the message.
   * @returns {void}
   */
  _output(level, message, attributes = {}) {
    console[level](message, attributes); // eslint-disable-line no-console
  }
}

export { ConsoleLogger };
