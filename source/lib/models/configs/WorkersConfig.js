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
   * @param {number} [config.'max-retries'=3] - Maximum number of times a job is retried before being marked dead.
   * @param {object} [config.retention] - JobRegistry retention limits.
   * @param {number} [config.retention.finished] - Maximum finished jobs retained.
   * @param {number} [config.retention.dead] - Maximum dead jobs retained.
   */
  constructor({ quantity = 1, retry_cooldown: retryCooldown = 2000, sleep = 500, 'max-retries': maxRetries = 3, retention } = {}) {
    this.quantity = quantity;
    this.retryCooldown = retryCooldown;
    this.sleep = sleep;
    this.maxRetries = maxRetries;
    this.retention = WorkersConfig.#normalizeRetention(retention);
  }

  static #normalizeRetention(retention) {
    if (retention == null) return undefined;
    const entries = Object.entries(retention).filter(([, value]) => value != null);
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
}

export { WorkersConfig };
