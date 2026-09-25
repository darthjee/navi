import { JobRegistry } from '../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../lib/background/WorkersRegistry.js';
import { IdentifyableCollection } from '../../lib/collections/IdentifyableCollection.js';
import { DummyJob } from '../support/dummies/models/DummyJob.js';
import { DummyWorkersAllocator } from '../support/dummies/services/DummyWorkersAllocator.js';
import { EngineSpecUtils } from '../support/utils/EngineSpecUtils.js';

describe('Engine asynchronous job handling', () => {
  const ctx = EngineSpecUtils.setup({
    workers: () => new IdentifyableCollection(),
    engineOptions: () => ({
      allocator: new DummyWorkersAllocator({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry }),
    }),
  });

  const stubWorkersRegistryIdleCheck = () => {
    spyOn(WorkersRegistry, 'hasIdleWorker').and.callFake(() => {
      const hasIdleWorker = WorkersRegistry.hasIdleWorker.and.originalFn.call(WorkersRegistry);

      if (!hasIdleWorker || !JobRegistry.hasJob()) {
        ctx.busy.list().forEach((worker) => worker.perform());
      }

      return hasIdleWorker;
    });
  };

  describe('#start', () => {
    describe('when jobs take some time to be processed', () => {
      beforeEach(() => {
        DummyJob.setSuccessRate(0.1);
        stubWorkersRegistryIdleCheck();
        EngineSpecUtils.enqueueJobs(20);
      });

      it('clears the job queue', async () => {
        expect(JobRegistry.hasJob()).toBeTrue();

        await ctx.engine.start();

        expect(JobRegistry.hasJob()).toBeFalse();
      });

      it('moves every job to either finished or dead', async () => {
        await ctx.engine.start();

        expect(ctx.finished.size() + ctx.dead.size()).toBe(20);
      });
    });
  });
});
