import { JobFactory, JobRegistry } from 'deku-swarm';
import { ResourceRequestJob } from '../../../../lib/jobs/ResourceRequestJob.js';
import { ClientRegistry } from '../../../../lib/registry/ClientRegistry.js';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { FailureChecker } from '../../../../lib/services/execution/FailureChecker.js';
import { RunReporter } from '../../../../lib/services/execution/RunReporter.js';
import { JobRegistryUtils } from '../../../support/utils/JobRegistryUtils.js';

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
        enqueued: 0,
        processing: 0,
        dead: 2,
        pruned: { finished: 0, dead: 0 },
      });
      spyOn(LogRegistry, 'info').and.stub();
      spyOn(FailureChecker.prototype, 'check').and.stub();

      reporter.report({ failureConfig: { threshold: 30 } });

      expect(LogRegistry.info).toHaveBeenCalledWith(
        'Total: 10\nFailed: 2 (20%)\nUnresolved: 2\nThreshold: 30%\nResult: Success'
      );
      expect(LogRegistry.info).toHaveBeenCalledBefore(FailureChecker.prototype.check);
    });

    it('derives the lifetime stats from JobRegistry.stats() and passes the threshold along', () => {
      spyOn(JobRegistry, 'stats').and.returnValue({
        total: 20,
        failed: 2,
        retryQueue: 3,
        enqueued: 0,
        processing: 0,
        dead: 1,
        pruned: { finished: 0, dead: 0 },
      });
      spyOn(LogRegistry, 'info').and.stub();
      spyOn(FailureChecker.prototype, 'check').and.stub();

      reporter.report({ failureConfig: { threshold: 50 } });

      expect(LogRegistry.info).toHaveBeenCalledWith(
        'Total: 20\nFailed: 1 (5%)\nUnresolved: 5\nThreshold: 50%\nResult: Success'
      );
    });

    it('runs the failure check', () => {
      spyOn(JobRegistry, 'stats').and.returnValue({ total: 0, failed: 0, retryQueue: 0, enqueued: 0, processing: 0, dead: 0, pruned: { finished: 0, dead: 0 } });
      spyOn(LogRegistry, 'info').and.stub();
      spyOn(FailureChecker.prototype, 'check').and.stub();

      reporter.report({ failureConfig: { threshold: 10 } });

      expect(FailureChecker.prototype.check).toHaveBeenCalled();
    });

    describe('with in-flight jobs', () => {
      beforeEach(() => {
        spyOn(LogRegistry, 'info').and.stub();
        spyOn(LogRegistry, 'error').and.stub();
        spyOn(process, 'exit').and.stub();
      });

      it('excludes in-flight jobs from the ratio and does not exit', () => {
        spyOn(JobRegistry, 'stats').and.returnValue({
          total: 10, failed: 5, retryQueue: 5, enqueued: 0, processing: 0, dead: 1, pruned: { finished: 0, dead: 0 },
        });

        reporter.report({ failureConfig: { threshold: 20 } });

        expect(LogRegistry.info).toHaveBeenCalledWith(jasmine.stringContaining('Result: Success'));
        expect(process.exit).not.toHaveBeenCalled();
      });

      it('reports failure in both when dead jobs exceed the threshold', () => {
        spyOn(JobRegistry, 'stats').and.returnValue({
          total: 10, failed: 5, retryQueue: 5, enqueued: 0, processing: 0, dead: 5, pruned: { finished: 0, dead: 0 },
        });

        reporter.report({ failureConfig: { threshold: 20 } });

        expect(LogRegistry.info).toHaveBeenCalledWith(jasmine.stringContaining('Result: Failure'));
        expect(process.exit).toHaveBeenCalledWith(1);
      });
    });

    describe('with pending jobs', () => {
      beforeEach(() => {
        spyOn(JobRegistry, 'stats').and.returnValue({
          total: 10, failed: 0, retryQueue: 0, enqueued: 3, processing: 2, dead: 1,
          pruned: { finished: 0, dead: 0 },
        });
        spyOn(LogRegistry, 'info').and.stub();
        spyOn(LogRegistry, 'error').and.stub();
        spyOn(process, 'exit').and.stub();
      });

      it('reports enqueued + processing as Pending', () => {
        reporter.report({ failureConfig: { threshold: 20 } });

        expect(LogRegistry.info).toHaveBeenCalledWith(
          'Total: 10\nFailed: 1 (10%)\nPending: 5\nThreshold: 20%\nResult: Success'
        );
      });

      it('does not make the failure check exit', () => {
        reporter.report({ failureConfig: { threshold: 20 } });

        expect(process.exit).not.toHaveBeenCalled();
      });
    });

    describe('single stats read', () => {
      beforeEach(() => {
        spyOn(JobRegistry, 'stats').and.returnValue({
          total: 10, failed: 0, retryQueue: 0, enqueued: 0, processing: 0, dead: 5, pruned: { finished: 0, dead: 0 },
        });
        spyOn(LogRegistry, 'info').and.stub();
        spyOn(LogRegistry, 'error').and.stub();
        spyOn(process, 'exit').and.stub();
      });

      it('reads JobRegistry.stats exactly once', () => {
        reporter.report({ failureConfig: { threshold: 10 } });

        expect(JobRegistry.stats).toHaveBeenCalledTimes(1);
      });

      it('exits and reports Failure from the same stats', () => {
        reporter.report({ failureConfig: { threshold: 10 } });

        expect(LogRegistry.info).toHaveBeenCalledWith(jasmine.stringContaining('Result: Failure'));
        expect(process.exit).toHaveBeenCalledWith(1);
      });
    });

    describe('with the real JobRegistry and retention', () => {
      beforeEach(() => {
        JobFactory.build('ResourceRequestJob', { klass: ResourceRequestJob, attributes: { clients: new ClientRegistry() } });
        JobRegistry.build({ cooldown: -1, retention: { finished: 2, dead: 2 } });
        spyOn(LogRegistry, 'info').and.stub();
        spyOn(LogRegistry, 'error').and.stub();
        spyOn(process, 'exit').and.stub();

        for (let i = 0; i < 20; i++) {
          JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: i } });
          const job = JobRegistry.pick();
          if (i % 4 === 0) {
            JobRegistryUtils.exhaust(job);
            JobRegistry.fail(job);
          } else {
            JobRegistry.finish(job);
          }
        }
      });

      afterEach(() => {
        JobRegistry.reset();
        JobFactory.reset();
      });

      it('reports lifetime counts', () => {
        reporter.report({ failureConfig: { threshold: 50 } });

        expect(LogRegistry.info).toHaveBeenCalledWith(jasmine.stringContaining('Total: 20\nFailed: 5 (25%)'));
      });

      it('fails consistently when over threshold', () => {
        reporter.report({ failureConfig: { threshold: 10 } });

        expect(LogRegistry.info).toHaveBeenCalledWith(jasmine.stringContaining('Result: Failure'));
        expect(process.exit).toHaveBeenCalledWith(1);
      });

      it('succeeds consistently when under threshold', () => {
        reporter.report({ failureConfig: { threshold: 30 } });

        expect(LogRegistry.info).toHaveBeenCalledWith(jasmine.stringContaining('Result: Success'));
        expect(process.exit).not.toHaveBeenCalled();
      });
    });

    describe('with pruned jobs', () => {
      const prunedStats = {
        total: 20, failed: 0, retryQueue: 0, enqueued: 0, processing: 0, dead: 10,
        pruned: { finished: 940, dead: 40 },
      };

      beforeEach(() => {
        spyOn(JobRegistry, 'stats').and.returnValue(prunedStats);
        spyOn(LogRegistry, 'info').and.stub();
        spyOn(LogRegistry, 'error').and.stub();
        spyOn(process, 'exit').and.stub();
      });

      it('reports lifetime totals', () => {
        reporter.report({ failureConfig: { threshold: 3 } });

        expect(LogRegistry.info).toHaveBeenCalledWith(
          'Total: 1000\nFailed: 50 (5%)\nThreshold: 3%\nResult: Failure'
        );
      });

      it('fails consistently with the failure checker when over threshold', () => {
        reporter.report({ failureConfig: { threshold: 3 } });

        expect(LogRegistry.info).toHaveBeenCalledWith(jasmine.stringContaining('Result: Failure'));
        expect(process.exit).toHaveBeenCalledWith(1);
      });

      it('succeeds consistently with the failure checker when under threshold', () => {
        reporter.report({ failureConfig: { threshold: 6 } });

        expect(LogRegistry.info).toHaveBeenCalledWith(jasmine.stringContaining('Result: Success'));
        expect(process.exit).not.toHaveBeenCalled();
      });
    });
  });
});
