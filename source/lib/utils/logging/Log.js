/**
 * Represents a single log entry with id, level, message, attributes and timestamp.
 * @author darthjee
 */
class Log {
  #id;
  #level;
  #message;
  #attributes;
  #timestamp;

  /**
   * Creates a new Log instance.
   * @param {number} id - Unique incremental identifier for this log.
   * @param {string} level - The log level (debug, info, warn, error).
   * @param {string} message - The log message.
   * @param {object} [attributes={}] - Optional structured metadata for the log entry.
   */
  constructor(id, level, message, attributes = {}) {
    this.#id = id;
    this.#level = level;
    this.#message = message;
    this.#attributes = attributes;
    this.#timestamp = new Date();
  }

  /**
   * Gets the log ID.
   * @returns {number} The log ID.
   */
  get id() {
    return this.#id;
  }

  /**
   * Gets the log level.
   * @returns {string} The log level.
   */
  get level() {
    return this.#level;
  }

  /**
   * Gets the log message.
   * @returns {string} The log message.
   */
  get message() {
    return this.#message;
  }

  /**
   * Gets the log attributes.
   * @returns {object} The structured metadata attached to this log entry.
   */
  get attributes() {
    return this.#attributes;
  }

  /**
   * Gets the log timestamp.
   * @returns {Date} The timestamp when the log was created.
   */
  get timestamp() {
    return this.#timestamp;
  }

  /**
   * Converts the log to a plain object.
   * @returns {object} Plain object representation of the log.
   */
  toJSON() {
    return {
      id: this.#id,
      level: this.#level,
      message: this.#message,
      attributes: this.#attributes,
      timestamp: this.#timestamp.toISOString()
    };
  }
}

export { Log };
