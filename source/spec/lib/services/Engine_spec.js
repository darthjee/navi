import { JobFactory } from '../../../lib/background/JobFactory.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { Engine } from '../../../lib/services/Engine.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { DummyJobFactory } from '../../support/dummies/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../../support/dummies/factories/DummyWorkerFactory.js';
import { DummyJob } from '../../support/dummies/models/DummyJob.js';
import { DummyWorkersAllocator } from '../../support/dummies/services/DummyWorkersAllocator.js';

describe('Engine', () => {
  let engine;
  let jobFactory;
  let workerFactory;
  let allocator;

  let finished;
  let dead;

  let busy;

  const enqueueJobs = (n) => {
    for (let i = 0; i < n; i++) {
      JobRegistry.enqueue('ResourceRequestJob', { resourceRequest: {}, parameters: {} });
    }
  };

  beforeEach(() => {
    Logger.suppress();
    jobFactory = new DummyJobFactory();
    finished = new IdentifyableCollection();
    dead = new IdentifyableCollection();
    JobFactory.registry('ResourceRequestJob', jobFactory);
    JobRegistry.build({ finished, dead, cooldown: -1 });

    workerFactory = new DummyWorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry });
    busy = new IdentifyableCollection();
    WorkersRegistry.build({ busy, quantity: 2, factory: workerFactory });
    WorkersRegistry.initWorkers();

    DummyJob.setSuccessRate(1);
    engine = new Engine({ sleepMs: -1 });

    spyOn(console, 'error').and.stub();
  });

  afterEach(() => {
    JobRegistry.reset();
    JobFactory.reset();
    WorkersRegistry.reset();
  });

  describe('start', () => {
    describe('when there are no jobs to process', () => {
      it('does nothing', async () => {
        expect(JobRegistry.hasJob()).toBeFalse();
        await engine.start();
        expect(JobRegistry.hasJob()).toBeFalse();
        expect(finished.size()).toBe(0);
      });
    });

    describe('when stop() is called before start()', () => {
      it('completes immediately without processing any jobs', async () => {
        enqueueJobs(2);
        engine.stop();
        await engine.start();
        expect(finished.size()).toBe(0);
      });
    });

    describe('when there are jobs to process', () => {
      beforeEach(() => { enqueueJobs(2); });

      it('processes all jobs', async () => {
        expect(JobRegistry.hasJob()).toBeTrue();
        await engine.start();
        expect(JobRegistry.hasJob()).toBeFalse();
        expect(finished.size()).toBe(2);
      });
    });

    describe('when there more jobs than workers', () => {
      beforeEach(() => { enqueueJobs(4); });

      it('processes all jobs', async () => {
        expect(JobRegistry.hasJob()).toBeTrue();
        await engine.start();
        expect(JobRegistry.hasJob()).toBeFalse();
        expect(finished.size()).toBe(4);
        expect(dead.size()).toBe(0);
      });
    });

    describe('when jobs fail all the time', () => {
      beforeEach(() => {
        DummyJob.setSuccessRate(0);
        enqueueJobs(1);
      });

      it('processes all jobs until they are in the dead queue', async () => {
        expect(JobRegistry.hasJob()).toBeTrue();
        await engine.start();
        expect(JobRegistry.hasJob()).toBeFalse();
        expect(finished.size()).toBe(0);
        expect(dead.size()).toBe(1);
      });
    });

    describe('when jobs fails some times', () => {
      beforeEach(() => {
        DummyJob.setSuccessRate(0.1);
        enqueueJobs(20);
      });

      it('processes all jobs until they are in the finished or dead', async () => {
        expect(JobRegistry.hasJob()).toBeTrue();
        await engine.start();
        expect(JobRegistry.hasJob()).toBeFalse();
        expect(finished.size() + dead.size()).toBe(20);
        expect(finished.size()).not.toBe(0);
        expect(dead.size()).not.toBe(0);
      });
    });

    describe('when jobs take some time to be processed', () => {
      let workers;

      const stubWorkersRegistryIdleCheck = () => {
        spyOn(WorkersRegistry, 'hasIdleWorker').and.callFake(() => {
          const result = WorkersRegistry.hasIdleWorker.and.originalFn.call(WorkersRegistry);
          if (!result || !JobRegistry.hasJob()) {
            busy.list().forEach(worker => worker.perform());
          }
          return result;
        });
      };

      beforeEach(() => {
        workers = new IdentifyableCollection();
        WorkersRegistry.reset();
        WorkersRegistry.build({ busy, quantity: 2, workers, factory: workerFactory });
        WorkersRegistry.initWorkers();
        allocator = new DummyWorkersAllocator();
        engine = new Engine({ allocator, sleepMs: -1 });
      });

      describe('with a low job success rate', () => {
        beforeEach(() => {
          DummyJob.setSuccessRate(0.1);
          stubWorkersRegistryIdleCheck();
          enqueueJobs(20);
        });

        it('clears the job queue', async () => {
          expect(JobRegistry.hasJob()).toBeTrue();
          await engine.start();
          expect(JobRegistry.hasJob()).toBeFalse();
        });

        it('moves all jobs to finished or dead', async () => {
          await engine.start();
          expect(finished.size() + dead.size()).toBe(20);
        });
      });
    });

    describe('promoteReadyJobs is called every cycle', () => {
      beforeEach(() => {
        enqueueJobs(2);
        spyOn(JobRegistry, 'promoteReadyJobs').and.callThrough();
      });

      it('calls promoteReadyJobs at least once per job processed', async () => {
        await engine.start();
        expect(JobRegistry.promoteReadyJobs).toHaveBeenCalled();
      });
    });

    describe('when all remaining jobs are in cooldown', () => {
      beforeEach(() => {
        JobRegistry.reset();
        JobRegistry.build({ finished, dead, cooldown: 0 });
        engine = new Engine({ sleepMs: -1 });
        DummyJob.setSuccessRate(0);
        JobRegistry.enqueue('ResourceRequestJob', { resourceRequest: {}, parameters: {} });
      });

      it('does not allocate a worker while job is in cooldown', async () => {
        spyOn(engine.allocator, 'allocate').and.callThrough();

        let callCount = 0;
        spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
          callCount++;
          if (callCount > 3) {
            JobRegistry.promoteReadyJobs.and.callThrough();
          }
        });

        await engine.start();

        expect(engine.allocator.allocate).toHaveBeenCalled();
      });
    });
  });
});
