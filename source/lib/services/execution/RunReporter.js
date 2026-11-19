import { JobRegistry } from 'deku-swarm';
import { FailureChecker } from './FailureChecker.js';
import { LifetimeJobStats } from './LifetimeJobStats.js';
import { RunSummary } from './RunSummary.js';
import { LogRegistry } from '../../registry/LogRegistry.js';

/**
 * RunReporter builds and logs the final run summary, then evaluates the
 * configured failure threshold. Counts are lifetime (resident + pruned,
 * since the last clearQueues()).
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
    const stats = LifetimeJobStats.fromStats(JobRegistry.stats());
    const summary = new RunSummary({ stats, threshold: failureConfig?.threshold });

    LogRegistry.info(summary.report());
    new FailureChecker({ failureConfig, stats }).check();
  }
}

export { RunReporter };
