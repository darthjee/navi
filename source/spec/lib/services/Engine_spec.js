import { JobFactory } from '../../../lib/background/JobFactory.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { Engine } from '../../../lib/services/Engine.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { DummyJobFactory } from '../../support/dummies/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../../support/dummies/factories/DummyWorkerFactory.js';
import { DummyJob } from '../../support/dummies/models/DummyJob.js';
import { RegistryCleanupUtils } from '../../support/utils/RegistryCleanupUtils.js';

describe('Engine', () => {
  let busy;
  let dead;
  let engine;
  let finished;
  let jobFactory;
  let workerFactory;

  const enqueueJobs = (count) => {
    for (let jobIndex = 0; jobIndex < count; jobIndex++) {
      JobRegistry.enqueue('ResourceRequestJob', { resourceRequest: {}, parameters: {} });
    }
  };

  const buildEngineContext = ({ cooldown = -1, sleepMs = -1 } = {}) => {
    finished = new IdentifyableCollection();
    dead = new IdentifyableCollection();
    busy = new IdentifyableCollection();
    jobFactory = new DummyJobFactory();
    workerFactory = new DummyWorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry });

    JobFactory.registry('ResourceRequestJob', jobFactory);
    JobRegistry.build({ finished, dead, cooldown });
    WorkersRegistry.build({ busy, quantity: 2, factory: workerFactory });
    WorkersRegistry.initWorkers();
    DummyJob.setSuccessRate(1);
    engine = new Engine({ sleepMs });
  };

  beforeEach(() => {
    Logger.suppress();
    buildEngineContext();
    spyOn(console, 'error').and.stub();
  });

  afterEach(() => {
    RegistryCleanupUtils.resetEngineState();
  });

  describe('#start', () => {
    it('does nothing when there are no jobs to process', async () => {
      expect(JobRegistry.hasJob()).toBeFalse();

      await engine.start();

      expect(JobRegistry.hasJob()).toBeFalse();
      expect(finished.size()).toBe(0);
    });

    it('stops immediately when stop() is called before start()', async () => {
      enqueueJobs(2);
      engine.stop();

      await engine.start();

      expect(finished.size()).toBe(0);
    });

    [2, 4].forEach((jobCount) => {
      it(`processes all jobs when ${jobCount} jobs are enqueued`, async () => {
        enqueueJobs(jobCount);

        await engine.start();

        expect(JobRegistry.hasJob()).toBeFalse();
        expect(finished.size()).toBe(jobCount);
        expect(dead.size()).toBe(0);
      });
    });

    it('moves always-failing jobs to the dead queue', async () => {
      DummyJob.setSuccessRate(0);
      enqueueJobs(1);

      await engine.start();

      expect(JobRegistry.hasJob()).toBeFalse();
      expect(finished.size()).toBe(0);
      expect(dead.size()).toBe(1);
    });

    it('finishes or kills jobs that fail intermittently', async () => {
      DummyJob.setSuccessRate(0.1);
      enqueueJobs(20);

      await engine.start();

      expect(JobRegistry.hasJob()).toBeFalse();
      expect(finished.size() + dead.size()).toBe(20);
      expect(finished.size()).not.toBe(0);
      expect(dead.size()).not.toBe(0);
    });

    it('calls promoteReadyJobs during processing', async () => {
      enqueueJobs(2);
      spyOn(JobRegistry, 'promoteReadyJobs').and.callThrough();

      await engine.start();

      expect(JobRegistry.promoteReadyJobs).toHaveBeenCalled();
    });

    it('keeps allocating while jobs cool down', async () => {
      RegistryCleanupUtils.resetEngineState();
      buildEngineContext({ cooldown: 0 });
      DummyJob.setSuccessRate(0);
      JobRegistry.enqueue('ResourceRequestJob', { resourceRequest: {}, parameters: {} });

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

    describe('when keepAlive is true', () => {
      it('keeps running when the queue becomes empty', async () => {
        engine = new Engine({ keepAlive: true, sleepMs: -1 });

        let iterations = 0;
        spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
          iterations++;
          if (iterations >= 3) engine.stop();
        });

        await engine.start();

        expect(iterations).toBeGreaterThanOrEqual(3);
      });

      it('skips allocation while paused', async () => {
        engine = new Engine({ keepAlive: true, sleepMs: -1 });
        engine.pause();
        spyOn(engine.allocator, 'allocate');
        spyOn(JobRegistry, 'hasReadyJob').and.returnValue(true);
        spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
          engine.stop();
        });

        await engine.start();

        expect(engine.allocator.allocate).not.toHaveBeenCalled();
      });

      it('resumes allocation after resume()', async () => {
        engine = new Engine({ keepAlive: true, sleepMs: -1 });
        engine.pause();
        engine.resume();
        spyOn(engine.allocator, 'allocate');
        spyOn(JobRegistry, 'hasReadyJob').and.returnValue(true);
        spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
          engine.stop();
        });

        await engine.start();

        expect(engine.allocator.allocate).toHaveBeenCalled();
      });
    });
  });
});
