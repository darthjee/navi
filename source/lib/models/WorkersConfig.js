/**
 * Represents the configuration for workers in the application.
 * @author darthjee
 */
class WorkersConfig {
  /**
   * Creates an instance of WorkersConfig.
   * @param {object} [config={}] - The configuration object.
   * @param {number} [config.quantity=1] - The number of worker threads.
   * @param {number} [config.retry_cooldown=2000] - The cooldown after a job has failed before retry.
   * @param {number} [config.sleep=500] - Milliseconds the engine sleeps between allocation ticks.
   */
  constructor({ quantity = 1, retry_cooldown: retryCooldown = 2000, sleep = 500 } = {}) {
    this.quantity = quantity;
    this.retryCooldown = retryCooldown;
    this.sleep = sleep;
  }
}

export { WorkersConfig };
