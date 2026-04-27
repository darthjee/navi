import { Log } from './Log.js';
import { IncrementalIdGenerator } from '../generators/IncrementalIdGenerator.js';

/**
 * LogFactory creates Log instances with automatically assigned incremental IDs.
 * @author darthjee
 */
class LogFactory {
  #idGenerator;

  /**
   * Creates a new LogFactory instance.
   * @param {object} [params={}] - Construction parameters.
   * @param {IncrementalIdGenerator} [params.idGenerator] - The id generator to use.
   */
  constructor({ idGenerator = new IncrementalIdGenerator() } = {}) {
    this.#idGenerator = idGenerator;
  }

  /**
   * Builds a new Log entry with an auto-assigned id.
   * @param {string} level - The log level.
   * @param {string} message - The log message.
   * @param {object} [attributes={}] - Optional structured metadata for the log entry.
   * @returns {Log} The created log entry.
   */
  build(level, message, attributes = {}) {
    const id = this.#idGenerator.generate();
    return new Log(id, level, message, attributes);
  }
}

export { LogFactory };
