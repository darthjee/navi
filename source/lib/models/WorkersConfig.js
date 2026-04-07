/**
 * Represents the configuration for workers in the application.
 */
class WorkersConfig {
  /**
   * Creates an instance of WorkersConfig.
   * @param {object} [config={}] - The configuration object.
   * @param {number} [config.quantity=1] - The number of worker threads.
   */
  constructor({ quantity = 1, retry_cooldown: retryCooldown = 2000 } = {}) {
    this.quantity = quantity;
    this.retryCooldown = retryCooldown;
  }
}

export { WorkersConfig };