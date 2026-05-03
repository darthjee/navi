import { JobFactory } from '../../../lib/background/JobFactory.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { FailureConfig } from '../../../lib/models/FailureConfig.js';
import { ClientRegistry } from '../../../lib/registry/ClientRegistry.js';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { FailureChecker } from '../../../lib/services/FailureChecker.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { Queue } from '../../../lib/utils/collections/Queue.js';

describe('FailureChecker', () => {
  let clients;
  let deadCollection;
  let finishedCollection;

  beforeEach(() => {
    clients = new ClientRegistry();
    JobFactory.build('ResourceRequestJob', { attributes: { clients } });

    deadCollection = new IdentifyableCollection();
    finishedCollection = new IdentifyableCollection();

    JobRegistry.build({
      queue: new Queue(),
      dead: deadCollection,
      finished: finishedCollection,
      cooldown: -1,
    });

    spyOn(process, 'exit').and.stub();
    spyOn(LogRegistry, 'error').and.stub();
  });

  afterEach(() => {
    JobRegistry.reset();
    JobFactory.reset();
  });

  describe('#check', () => {
    describe('when failureConfig is null', () => {
      it('does not call process.exit', () => {
        const checker = new FailureChecker({ failureConfig: null });
        checker.check();
        expect(process.exit).not.toHaveBeenCalled();
      });
    });

    describe('when failureConfig is present', () => {
      let failureConfig;

      beforeEach(() => {
        failureConfig = new FailureConfig({ threshold: 10.0 });
      });

      describe('when total is zero (no jobs ran)', () => {
        it('does not call process.exit', () => {
          const checker = new FailureChecker({ failureConfig });
          checker.check();
          expect(process.exit).not.toHaveBeenCalled();
        });
      });

      describe('when dead ratio exceeds threshold', () => {
        beforeEach(() => {
          // Enqueue 2 jobs: mark one dead, one finished → ratio = 50% > 10%
          JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
          JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });

          const job1 = JobRegistry.pick();
          try { job1._fail(new Error()); } catch { /* expected */ }
          try { job1._fail(new Error()); } catch { /* expected */ }
          try { job1._fail(new Error()); } catch { /* expected */ }
          JobRegistry.fail(job1);

          const job2 = JobRegistry.pick();
          JobRegistry.finish(job2);
        });

        it('calls process.exit(1)', () => {
          const checker = new FailureChecker({ failureConfig });
          checker.check();
          expect(process.exit).toHaveBeenCalledWith(1);
        });

        it('logs an error message', () => {
          const checker = new FailureChecker({ failureConfig });
          checker.check();
          expect(LogRegistry.error).toHaveBeenCalledWith(
            jasmine.stringContaining('Failure threshold exceeded')
          );
        });
      });

      describe('when dead ratio is within threshold', () => {
        beforeEach(() => {
          // 10 finished, 0 dead → ratio = 0% ≤ 10%
          for (let i = 0; i < 10; i++) {
            JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: i } });
            const job = JobRegistry.pick();
            JobRegistry.finish(job);
          }
        });

        it('does not call process.exit', () => {
          const checker = new FailureChecker({ failureConfig });
          checker.check();
          expect(process.exit).not.toHaveBeenCalled();
        });
      });
    });
  });
});
