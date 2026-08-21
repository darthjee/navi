import { JobFactory } from '../../lib/background/JobFactory.js';
import { JobRegistry } from '../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../lib/background/WorkersRegistry.js';
import { IdentifyableCollection } from '../../lib/collections/IdentifyableCollection.js';
import { Engine } from '../../lib/services/Engine.js';
import { DummyJobFactory } from '../support/dummies/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../support/dummies/factories/DummyWorkerFactory.js';
import { DummyJob } from '../support/dummies/models/DummyJob.js';
import { RegistryCleanupUtils } from '../support/utils/RegistryCleanupUtils.js';

describe('Engine', () => {
  let busy;
  let dead;
  let engine;
  let finished;
  let jobFactory;
  let workerFactory;

  const enqueueJobs = (count) => {
    for (let i = 0; i < count; i++) {
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
    engine = new Engine({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, sleepMs });
  };

  beforeEach(() => {
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
        engine = new Engine({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, keepAlive: true, sleepMs: -1 });

        let iterations = 0;
        spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
          iterations++;
          if (iterations >= 3) engine.stop();
        });

        await engine.start();

        expect(iterations).toBeGreaterThanOrEqual(3);
      });

      it('skips allocation while paused', async () => {
        engine = new Engine({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, keepAlive: true, sleepMs: -1 });
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
        engine = new Engine({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, keepAlive: true, sleepMs: -1 });
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

      describe('idle timeout', () => {
        // Idle-timeout tests exercise real Date.now() elapsed time (like Job.js's
        // readyBy/isReadyBy), so every test that expects onIdleTimeout NOT to be
        // driven by real time uses a hard iteration safety net (via promoteReadyJobs)
        // so a broken implementation fails fast instead of hanging the suite.
        const SAFETY_NET_ITERATIONS = 20000;

        it('never fires when idleTimeoutMs is 0 (the default — disabled)', async () => {
          const onIdleTimeout = jasmine.createSpy('onIdleTimeout');
          engine = new Engine({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, keepAlive: true, sleepMs: -1, onIdleTimeout });

          let iterations = 0;
          spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
            iterations++;
            if (iterations >= 5) engine.stop();
          });

          await engine.start();

          expect(onIdleTimeout).not.toHaveBeenCalled();
        });

        it('fires once after the queue and workers have been idle for idleTimeoutMs', async () => {
          const onIdleTimeout = jasmine.createSpy('onIdleTimeout').and.callFake(() => engine.stop());
          engine = new Engine({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, keepAlive: true, sleepMs: -1, idleTimeoutMs: 1, onIdleTimeout });

          let iterations = 0;
          spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
            iterations++;
            if (iterations >= SAFETY_NET_ITERATIONS) engine.stop();
          });

          await engine.start();

          expect(onIdleTimeout).toHaveBeenCalledTimes(1);
          expect(iterations).toBeLessThan(SAFETY_NET_ITERATIONS);
        });

        it('fires at most once even while remaining idle across further ticks', async () => {
          const onIdleTimeout = jasmine.createSpy('onIdleTimeout');
          engine = new Engine({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, keepAlive: true, sleepMs: -1, idleTimeoutMs: 1, onIdleTimeout });

          let iterations = 0;
          spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
            iterations++;
            if (onIdleTimeout.calls.count() > 0 && iterations >= 100) engine.stop();
            if (iterations >= SAFETY_NET_ITERATIONS) engine.stop();
          });

          await engine.start();

          expect(onIdleTimeout).toHaveBeenCalledTimes(1);
        });

        it('does not fire while jobs are queued', async () => {
          const onIdleTimeout = jasmine.createSpy('onIdleTimeout');
          spyOn(JobRegistry, 'hasJob').and.returnValue(true);
          engine = new Engine({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, keepAlive: true, sleepMs: -1, idleTimeoutMs: 1, onIdleTimeout });

          let iterations = 0;
          spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
            iterations++;
            if (iterations >= SAFETY_NET_ITERATIONS) engine.stop();
          });

          await engine.start();

          expect(onIdleTimeout).not.toHaveBeenCalled();
        });

        it('resets the idle window when activity resumes, then fires once idle again', async () => {
          const onIdleTimeout = jasmine.createSpy('onIdleTimeout').and.callFake(() => engine.stop());
          let busy = true;
          spyOn(WorkersRegistry, 'hasBusyWorker').and.callFake(() => busy);
          engine = new Engine({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, keepAlive: true, sleepMs: -1, idleTimeoutMs: 1, onIdleTimeout });

          let iterations = 0;
          spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
            iterations++;
            if (iterations === 100) busy = false; // goes idle only after a while spent busy
            if (iterations >= SAFETY_NET_ITERATIONS) engine.stop();
          });

          await engine.start();

          expect(onIdleTimeout).toHaveBeenCalledTimes(1);
          expect(iterations).toBeGreaterThanOrEqual(100);
          expect(iterations).toBeLessThan(SAFETY_NET_ITERATIONS);
        });
      });
    });
  });
});
