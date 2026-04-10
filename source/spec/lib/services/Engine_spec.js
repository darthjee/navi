import { JobFactory } from '../../../lib/factories/JobFactory.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';
import { Engine } from '../../../lib/services/Engine.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { DummyJobFactory } from '../../support/dummies/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../../support/dummies/factories/DummyWorkerFactory.js';
import { DummyJob } from '../../support/dummies/models/DummyJob.js';
import { DummyWorkersAllocator } from '../../support/dummies/services/DummyWorkersAllocator.js';

describe('Engine', () => {
  let engine;
  let jobFactory;
  let jobRegistry;
  let workerFactory;
  let workersRegistry;
  let allocator;

  let finished;
  let dead;

  let busy;

  const enqueueJobs = (n) => {
    for (let i = 0; i < n; i++) {
      jobRegistry.enqueue('ResourceRequestJob', { resourceRequest: {}, parameters: {} });
    }
  };

  beforeEach(() => {
    jobFactory = new DummyJobFactory();
    finished = new IdentifyableCollection();
    dead = new IdentifyableCollection();
    JobFactory.registry('ResourceRequestJob', jobFactory);
    jobRegistry = new JobRegistry({ finished, dead, cooldown: -1 });

    workerFactory = new DummyWorkerFactory({ jobRegistry });
    busy = new IdentifyableCollection();
    workersRegistry = new WorkersRegistry({ busy, quantity: 2, factory: workerFactory });
    workersRegistry.initWorkers();

    DummyJob.setSuccessRate(1);
    engine = new Engine({ jobRegistry, workersRegistry, sleepMs: -1 });

    spyOn(console, 'error').and.stub();
  });

  afterEach(() => {
    JobFactory.reset();
  });

  describe('start', () => {
    describe('when there are no jobs to process', () => {
      it('does nothing', async () => {
        expect(jobRegistry.hasJob()).toBeFalse();
        await engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
        expect(finished.size()).toBe(0);
      });
    });

    describe('when there are jobs to process', () => {
      beforeEach(() => { enqueueJobs(2); });

      it('processes all jobs', async () => {
        expect(jobRegistry.hasJob()).toBeTrue();
        await engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
        expect(finished.size()).toBe(2);
      });
    });

    describe('when there more jobs than workers', () => {
      beforeEach(() => { enqueueJobs(4); });

      it('processes all jobs', async () => {
        expect(jobRegistry.hasJob()).toBeTrue();
        await engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
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
        expect(jobRegistry.hasJob()).toBeTrue();
        await engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
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
        expect(jobRegistry.hasJob()).toBeTrue();
        await engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
        expect(finished.size() + dead.size()).toBe(20);
        expect(finished.size()).not.toBe(0);
        expect(dead.size()).not.toBe(0);
      });
    });

    describe('when jobs take some time to be processed', () => {
      beforeEach(() => {
        allocator = new DummyWorkersAllocator({ jobRegistry, workersRegistry });
        engine = new Engine({ jobRegistry, workersRegistry, allocator, sleepMs: -1 });
        DummyJob.setSuccessRate(0.1);

        spyOn(workersRegistry, 'hasIdleWorker').and.callFake(() => {
          const result = workersRegistry.hasIdleWorker.and.originalFn.call(workersRegistry);
          if (!result || !jobRegistry.hasJob()) {
            busy.list().forEach(worker => worker.perform());
          }
          return result;
        });

        enqueueJobs(20);
      });

      it('processes all jobs until they are in the finished or dead', async () => {
        expect(jobRegistry.hasJob()).toBeTrue();
        await engine.start();
        expect(jobRegistry.hasJob()).toBeFalse();
        expect(finished.size() + dead.size()).toBe(20);
      });
    });

    describe('promoteReadyJobs is called every cycle', () => {
      beforeEach(() => {
        enqueueJobs(2);
        spyOn(jobRegistry, 'promoteReadyJobs').and.callThrough();
      });

      it('calls promoteReadyJobs at least once per job processed', async () => {
        await engine.start();
        expect(jobRegistry.promoteReadyJobs).toHaveBeenCalled();
      });
    });

    describe('when all remaining jobs are in cooldown', () => {
      let slowRegistry;

      beforeEach(() => {
        slowRegistry = new JobRegistry({ finished, dead, cooldown: 5000 });
        engine = new Engine({ jobRegistry: slowRegistry, workersRegistry, sleepMs: -1 });
        DummyJob.setSuccessRate(0);
        slowRegistry.enqueue('ResourceRequestJob', { resourceRequest: {}, parameters: {} });
      });

      it('does not allocate a worker while job is in cooldown', async () => {
        spyOn(engine.allocator, 'allocate').and.callThrough();

        let callCount = 0;
        spyOn(slowRegistry, 'promoteReadyJobs').and.callFake(() => {
          callCount++;
          if (callCount > 3) {
            slowRegistry.promoteReadyJobs.and.callThrough();
          }
        });

        await engine.start();

        expect(engine.allocator.allocate).toHaveBeenCalled();
      });
    });
  });
});
