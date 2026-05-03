import { LogRegistry } from '../../registry/LogRegistry.js';

/**
 * LogContext wraps a fixed set of attributes and forwards log calls to LogRegistry
 * with those attributes merged into every entry.
 * @author darthjee
 */
class LogContext {
  #attributes;

  /**
   * @param {object} attributes Fixed attributes to include on every log entry (e.g. workerId, jobId).
   */
  constructor(attributes) {
    this.#attributes = attributes;
  }

  /**
   * @param {string} message The log message.
   * @param {object} [attrs={}] Additional per-call attributes merged with context attributes.
   */
  debug(message, attrs = {}) {
    LogRegistry.debug(message, { ...this.#attributes, ...attrs });
  }

  /**
   * @param {string} message The log message.
   * @param {object} [attrs={}] Additional per-call attributes merged with context attributes.
   */
  info(message, attrs = {}) {
    LogRegistry.info(message, { ...this.#attributes, ...attrs });
  }

  /**
   * @param {string} message The log message.
   * @param {object} [attrs={}] Additional per-call attributes merged with context attributes.
   */
  warn(message, attrs = {}) {
    LogRegistry.warn(message, { ...this.#attributes, ...attrs });
  }

  /**
   * @param {string} message The log message.
   * @param {object} [attrs={}] Additional per-call attributes merged with context attributes.
   */
  error(message, attrs = {}) {
    LogRegistry.error(message, { ...this.#attributes, ...attrs });
  }
}

export { LogContext };
