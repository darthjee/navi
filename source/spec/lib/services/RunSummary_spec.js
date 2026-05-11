import { RunSummary } from '../../../lib/services/RunSummary.js';

describe('RunSummary', () => {
  describe('#percentage', () => {
    it('returns zero when total is zero', () => {
      const summary = new RunSummary({ totalJobs: 0, failedJobs: 3, threshold: 30 });

      expect(summary.percentage()).toBe(0);
    });

    it('calculates percentage based on failed and total jobs', () => {
      const summary = new RunSummary({ totalJobs: 10, failedJobs: 4, threshold: 30 });

      expect(summary.percentage()).toBe(40);
    });
  });

  describe('#result', () => {
    it('returns failure when percentage exceeds threshold', () => {
      const summary = new RunSummary({ totalJobs: 10, failedJobs: 4, threshold: 30 });

      expect(summary.result()).toBe('Failure');
    });

    it('returns success when percentage is within threshold', () => {
      const summary = new RunSummary({ totalJobs: 10, failedJobs: 3, threshold: 30 });

      expect(summary.result()).toBe('Success');
    });

    it('returns success when threshold is not configured', () => {
      const summary = new RunSummary({ totalJobs: 10, failedJobs: 10 });

      expect(summary.result()).toBe('Success');
    });
  });

  describe('#report', () => {
    it('formats summary output with all required lines', () => {
      const summary = new RunSummary({ totalJobs: 10, failedJobs: 4, threshold: 30 });

      expect(summary.report()).toBe(
        'Total: 10\nFailed: 4 (40%)\nThreshold: 30%\nResult: Failure'
      );
    });

    it('formats threshold as N/A when threshold is not configured', () => {
      const summary = new RunSummary({ totalJobs: 10, failedJobs: 2 });

      expect(summary.report()).toContain('Threshold: N/A');
    });
  });
});
