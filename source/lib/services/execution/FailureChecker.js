import { LogRegistry } from '../../registry/LogRegistry.js';

/**
 * FailureChecker evaluates the dead-job ratio after a run and exits with a non-zero
 * code when the ratio exceeds the configured threshold.
 * @author darthjee
 */
class FailureChecker {
  #failureConfig;
  #stats;
  #cachedRatio;

  /**
   * Creates a new FailureChecker instance.
   * @param {object} params - Construction parameters.
   * @param {FailureConfig|null} params.failureConfig - The failure threshold configuration, or null to skip checking.
   * @param {LifetimeJobStats} params.stats - Lifetime job stats to evaluate.
   */
  constructor({ failureConfig, stats }) {
    this.#failureConfig = failureConfig;
    this.#stats = stats;
  }

  /**
   * Checks the dead-job ratio against the configured failure threshold and exits with
   * a non-zero code if the threshold is exceeded.
   * @returns {void}
   */
  check() {
    if (!this.#failureConfig) return;

    if (this.#stats.total === 0) return;

    if (this.#isOverThreshold()) {
      this.#fail();
    }
  }

  /**
   * Calculates the lifetime percentage of dead jobs relative to total jobs.
   * The result is memoized after the first call.
   * @returns {number} The dead-job ratio as a percentage (0–100).
   */
  #ratio() {
    this.#cachedRatio ??= (this.#stats.dead / this.#stats.total) * 100;
    return this.#cachedRatio;
  }

  /**
   * Returns true when the dead-job ratio exceeds the configured threshold.
   * @returns {boolean} True if the ratio is above the configured threshold.
   */
  #isOverThreshold() {
    return this.#ratio() > this.#failureConfig.threshold;
  }

  /**
   * Logs a descriptive error message and exits the process with a non-zero code.
   * @returns {void}
   */
  #fail() {
    LogRegistry.error(`Failure threshold exceeded: ${this.#ratio().toFixed(2)}% of jobs are dead (threshold: ${this.#failureConfig.threshold}%)`);
    process.exit(1);
  }
}

export { FailureChecker };
