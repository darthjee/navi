/**
 * Represents the configuration for workers in the application.
 */
class WorkersConfig {
  /**
   * Creates an instance of WorkersConfig.
   * @param {Object} [config={}] - The configuration object.
   * @param {number} [config.quantity=1] - The number of worker threads.
   */
  constructor({ quantity = 1 } = {}) {
    this.quantity = quantity;
  }
}

export { WorkersConfig };