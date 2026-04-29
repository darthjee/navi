import { JobRegistry } from '../registry/JobRegistry.js';
import { Logger } from '../utils/logging/Logger.js';

/**
 * FailureChecker evaluates the dead-job ratio after a run and exits with a non-zero
 * code when the ratio exceeds the configured threshold.
 * @author darthjee
 */
class FailureChecker {
  #failureConfig;

  /**
   * Creates a new FailureChecker instance.
   * @param {object} params - Construction parameters.
   * @param {FailureConfig|null} params.failureConfig - The failure threshold configuration, or null to skip checking.
   */
  constructor({ failureConfig }) {
    this.#failureConfig = failureConfig;
  }

  /**
   * Checks the dead-job ratio against the configured failure threshold and exits with
   * a non-zero code if the threshold is exceeded.
   * @returns {void}
   */
  check() {
    if (!this.#failureConfig) return;

    const { dead, total } = JobRegistry.stats();
    if (total === 0) return;

    const ratio = (dead / total) * 100;
    if (ratio > this.#failureConfig.threshold) {
      Logger.error(`Failure threshold exceeded: ${ratio.toFixed(2)}% of jobs are dead (threshold: ${this.#failureConfig.threshold}%)`);
      process.exit(1);
    }
  }
}

export { FailureChecker };
