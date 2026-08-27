import { JobRegistry } from 'deku-swarm';
import { FailureChecker } from './FailureChecker.js';
import { RunSummary } from './RunSummary.js';
import { LogRegistry } from '../registry/LogRegistry.js';

/**
 * RunReporter builds and logs the final run summary, then evaluates the
 * configured failure threshold.
 * @author darthjee
 */
class RunReporter {
  /**
   * Logs the run summary and runs the failure-threshold check, in that order.
   * @param {object} params - Construction parameters.
   * @param {object} [params.failureConfig] - Failure threshold configuration.
   * @returns {void}
   */
  report({ failureConfig } = {}) {
    const stats = JobRegistry.stats();
    const summary = new RunSummary({
      totalJobs: stats.total,
      failedJobs: stats.failed + stats.retryQueue + stats.dead,
      threshold: failureConfig?.threshold,
    });

    LogRegistry.info(summary.report());
    new FailureChecker({ failureConfig }).check();
  }
}

export { RunReporter };
