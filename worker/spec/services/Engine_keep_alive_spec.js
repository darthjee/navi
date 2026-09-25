import { JobRegistry } from '../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../lib/background/WorkersRegistry.js';
import { EngineSpecUtils } from '../support/utils/EngineSpecUtils.js';

describe('Engine', () => {
  const { buildEngine, stopAfterIterations } = EngineSpecUtils;

  EngineSpecUtils.setup();

  beforeEach(() => {
    spyOn(console, 'error').and.stub();
  });

  describe('#start', () => {
    describe('when keepAlive is true', () => {
      const startOnceWithReadyJob = async (engine) => {
        spyOn(engine.allocator, 'allocate');
        spyOn(JobRegistry, 'hasReadyJob').and.returnValue(true);
        stopAfterIterations(engine, { limit: 1 });

        await engine.start();
      };

      it('keeps running when the queue becomes empty', async () => {
        const engine = buildEngine({ keepAlive: true });
        const iterations = stopAfterIterations(engine, { limit: 3 });

        await engine.start();

        expect(iterations.count).toBeGreaterThanOrEqual(3);
      });

      it('skips allocation while paused', async () => {
        const engine = buildEngine({ keepAlive: true });
        engine.pause();

        await startOnceWithReadyJob(engine);

        expect(engine.allocator.allocate).not.toHaveBeenCalled();
      });

      it('resumes allocation after resume()', async () => {
        const engine = buildEngine({ keepAlive: true });
        engine.pause();
        engine.resume();

        await startOnceWithReadyJob(engine);

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
          const engine = buildEngine({ keepAlive: true, onIdleTimeout });
          stopAfterIterations(engine, { limit: 5 });

          await engine.start();

          expect(onIdleTimeout).not.toHaveBeenCalled();
        });

        it('fires once after the queue and workers have been idle for idleTimeoutMs', async () => {
          const onIdleTimeout = jasmine.createSpy('onIdleTimeout').and.callFake(() => engine.stop());
          const engine = buildEngine({ keepAlive: true, idleTimeoutMs: 1, onIdleTimeout });
          const iterations = stopAfterIterations(engine, { limit: SAFETY_NET_ITERATIONS });

          await engine.start();

          expect(onIdleTimeout).toHaveBeenCalledTimes(1);
          expect(iterations.count).toBeLessThan(SAFETY_NET_ITERATIONS);
        });

        it('fires at most once even while remaining idle across further ticks', async () => {
          const onIdleTimeout = jasmine.createSpy('onIdleTimeout');
          const engine = buildEngine({ keepAlive: true, idleTimeoutMs: 1, onIdleTimeout });
          stopAfterIterations(engine, {
            limit: SAFETY_NET_ITERATIONS,
            onIteration: (count) => {
              if (onIdleTimeout.calls.count() > 0 && count >= 100) engine.stop();
            },
          });

          await engine.start();

          expect(onIdleTimeout).toHaveBeenCalledTimes(1);
        });

        it('does not fire while jobs are queued', async () => {
          const onIdleTimeout = jasmine.createSpy('onIdleTimeout');
          spyOn(JobRegistry, 'hasJob').and.returnValue(true);
          const engine = buildEngine({ keepAlive: true, idleTimeoutMs: 1, onIdleTimeout });
          stopAfterIterations(engine, { limit: SAFETY_NET_ITERATIONS });

          await engine.start();

          expect(onIdleTimeout).not.toHaveBeenCalled();
        });

        it('resets the idle window when activity resumes, then fires once idle again', async () => {
          const onIdleTimeout = jasmine.createSpy('onIdleTimeout').and.callFake(() => engine.stop());
          let workersBusy = true;
          spyOn(WorkersRegistry, 'hasBusyWorker').and.callFake(() => workersBusy);
          const engine = buildEngine({ keepAlive: true, idleTimeoutMs: 1, onIdleTimeout });
          const iterations = stopAfterIterations(engine, {
            limit: SAFETY_NET_ITERATIONS,
            onIteration: (count) => {
              if (count === 100) workersBusy = false; // goes idle only after a while spent busy
            },
          });

          await engine.start();

          expect(onIdleTimeout).toHaveBeenCalledTimes(1);
          expect(iterations.count).toBeGreaterThanOrEqual(100);
          expect(iterations.count).toBeLessThan(SAFETY_NET_ITERATIONS);
        });
      });
    });
  });
});
