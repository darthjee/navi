import { JobRegistry } from 'deku-swarm';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { FailureChecker } from '../../../lib/services/FailureChecker.js';
import { RunReporter } from '../../../lib/services/RunReporter.js';

describe('RunReporter', () => {
  let reporter;

  beforeEach(() => {
    reporter = new RunReporter();
  });

  describe('#report', () => {
    it('logs the summary before checking failures', () => {
      spyOn(JobRegistry, 'stats').and.returnValue({
        total: 10,
        failed: 1,
        retryQueue: 1,
        dead: 2,
      });
      spyOn(LogRegistry, 'info').and.stub();
      spyOn(FailureChecker.prototype, 'check').and.stub();

      reporter.report({ failureConfig: { threshold: 30 } });

      expect(LogRegistry.info).toHaveBeenCalledWith(
        'Total: 10\nFailed: 4 (40%)\nThreshold: 30%\nResult: Failure'
      );
      expect(LogRegistry.info).toHaveBeenCalledBefore(FailureChecker.prototype.check);
    });

    it('derives totalJobs/failedJobs from JobRegistry.stats() and passes the threshold along', () => {
      spyOn(JobRegistry, 'stats').and.returnValue({
        total: 20,
        failed: 2,
        retryQueue: 3,
        dead: 1,
      });
      spyOn(LogRegistry, 'info').and.stub();
      spyOn(FailureChecker.prototype, 'check').and.stub();

      reporter.report({ failureConfig: { threshold: 50 } });

      expect(LogRegistry.info).toHaveBeenCalledWith(
        'Total: 20\nFailed: 6 (30%)\nThreshold: 50%\nResult: Success'
      );
    });

    it('runs the failure check', () => {
      spyOn(JobRegistry, 'stats').and.returnValue({ total: 0, failed: 0, retryQueue: 0, dead: 0 });
      spyOn(LogRegistry, 'info').and.stub();
      spyOn(FailureChecker.prototype, 'check').and.stub();

      reporter.report({ failureConfig: { threshold: 10 } });

      expect(FailureChecker.prototype.check).toHaveBeenCalled();
    });
  });
});
