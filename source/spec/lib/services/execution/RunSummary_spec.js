import { LifetimeJobStats } from '../../../../lib/services/execution/LifetimeJobStats.js';
import { RunSummary } from '../../../../lib/services/execution/RunSummary.js';

describe('RunSummary', () => {
  const build = ({ total, dead, unresolved = 0, pending = 0, threshold }) => new RunSummary({
    stats: new LifetimeJobStats({ total, dead, unresolved, pending }),
    threshold,
  });

  describe('#percentage', () => {
    it('returns zero when total is zero', () => {
      expect(build({ total: 0, dead: 0, threshold: 30 }).percentage()).toBe(0);
    });

    it('calculates percentage based on dead and total jobs', () => {
      expect(build({ total: 10, dead: 4, threshold: 30 }).percentage()).toBe(40);
    });

    it('never exceeds 100% with unresolved jobs', () => {
      expect(build({ total: 5, dead: 5, unresolved: 20 }).percentage()).toBe(100);
    });

    it('is not affected by pending jobs', () => {
      expect(build({ total: 10, dead: 4, pending: 50, threshold: 30 }).percentage()).toBe(40);
    });
  });

  describe('#result', () => {
    it('returns failure when percentage exceeds threshold', () => {
      expect(build({ total: 10, dead: 4, threshold: 30 }).result()).toBe('Failure');
    });

    it('returns success when percentage is within threshold', () => {
      expect(build({ total: 10, dead: 3, threshold: 30 }).result()).toBe('Success');
    });

    it('returns success when threshold is not configured', () => {
      expect(build({ total: 10, dead: 10 }).result()).toBe('Success');
    });

    it('is not affected by pending jobs', () => {
      expect(build({ total: 10, dead: 3, pending: 50, threshold: 30 }).result()).toBe('Success');
    });
  });

  describe('#report', () => {
    it('formats summary output with all required lines', () => {
      expect(build({ total: 10, dead: 4, threshold: 30 }).report()).toBe(
        'Total: 10\nFailed: 4 (40%)\nThreshold: 30%\nResult: Failure'
      );
    });

    it('formats threshold as N/A when threshold is not configured', () => {
      expect(build({ total: 10, dead: 2 }).report()).toContain('Threshold: N/A');
    });

    it('omits the Unresolved line when there are none', () => {
      expect(build({ total: 10, dead: 2 }).report()).not.toContain('Unresolved');
    });

    it('prints Unresolved after Failed when there are in-flight jobs', () => {
      expect(build({ total: 10, dead: 4, unresolved: 3, threshold: 30 }).report()).toBe(
        'Total: 10\nFailed: 4 (40%)\nUnresolved: 3\nThreshold: 30%\nResult: Failure'
      );
    });

    it('handles zero total with unresolved jobs', () => {
      expect(build({ total: 0, dead: 0, unresolved: 7, threshold: 30 }).report()).toBe(
        'Total: 0\nFailed: 0 (0%)\nUnresolved: 7\nThreshold: 30%\nResult: Success'
      );
    });

    it('omits the Pending line when there are none', () => {
      expect(build({ total: 10, dead: 2 }).report()).not.toContain('Pending');
    });

    it('prints Pending after Failed when there are pending jobs', () => {
      expect(build({ total: 10, dead: 4, pending: 5, threshold: 30 }).report()).toBe(
        'Total: 10\nFailed: 4 (40%)\nPending: 5\nThreshold: 30%\nResult: Failure'
      );
    });

    it('prints Unresolved before Pending', () => {
      expect(build({ total: 10, dead: 4, unresolved: 3, pending: 5, threshold: 30 }).report()).toBe(
        'Total: 10\nFailed: 4 (40%)\nUnresolved: 3\nPending: 5\nThreshold: 30%\nResult: Failure'
      );
    });

    it('handles zero total with pending jobs', () => {
      expect(build({ total: 0, dead: 0, pending: 7, threshold: 30 }).report()).toBe(
        'Total: 0\nFailed: 0 (0%)\nPending: 7\nThreshold: 30%\nResult: Success'
      );
    });
  });
});
