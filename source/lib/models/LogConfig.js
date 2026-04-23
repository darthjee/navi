/**
 * Represents the log configuration for the application.
 * @author darthjee
 */
class LogConfig {
  #size;

  /**
   * Creates an instance of LogConfig.
   * @param {object} [config={}] - The configuration object.
   * @param {number} [config.size=100] - The maximum number of log entries to retain.
   */
  constructor({ size = 100 } = {}) {
    this.#size = size;
  }

  /**
   * Gets the maximum number of log entries to retain.
   * @returns {number} The log buffer size.
   */
  get size() {
    return this.#size;
  }

  /**
   * Creates a LogConfig instance from a raw YAML object.
   * @param {object|null|undefined} obj - The raw log config object from YAML.
   * @returns {LogConfig} A new LogConfig instance.
   */
  static fromObject(obj) {
    return new LogConfig(obj ?? {});
  }
}

export { LogConfig };
