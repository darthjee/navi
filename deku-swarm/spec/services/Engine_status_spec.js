import { JobRegistry } from '../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../lib/background/WorkersRegistry.js';
import { EngineSpecUtils } from '../support/utils/EngineSpecUtils.js';

describe('Engine status', () => {
  const { buildEngine } = EngineSpecUtils;

  EngineSpecUtils.setup();

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  describe('before start()', () => {
    it('is idle with empty snapshot', () => {
      const engine = buildEngine();

      expect(engine.status).toBe('idle');
      expect(engine.snapshot()).toEqual({
        status: 'idle', startedAt: null, stoppedAt: null, lastTickAt: null, lastError: null
      });
    });
  });

  describe('while running', () => {
    it('is running with timestamps set and stoppedAt null', async () => {
      const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
      const started = engine.start();
      await sleep(10);
      const snap = engine.snapshot();

      expect(snap.status).toBe('running');
      expect(snap.startedAt).toEqual(jasmine.any(Number));
      expect(snap.lastTickAt).toEqual(jasmine.any(Number));
      expect(snap.stoppedAt).toBeNull();

      engine.stop();
      await started;
    });

    it('is paused after pause() and running after resume()', async () => {
      const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
      const started = engine.start();
      engine.pause();

      expect(engine.status).toBe('paused');
      engine.resume();
      expect(engine.status).toBe('running');

      engine.stop();
      await started;
    });

    it('is draining during shutdown with a busy worker', async () => {
      spyOn(WorkersRegistry, 'hasBusyWorker').and.returnValue(true);
      const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
      const started = engine.start();
      const drained = engine.shutdown({ timeoutMs: 30 });

      expect(engine.status).toBe('draining');
      await drained;
      await started;
    });

    it('is stopping right after stop()', async () => {
      const engine = buildEngine({ keepAlive: true, sleepMs: 5 });
      const started = engine.start();
      engine.stop();

      expect(engine.status).toBe('stopping');
      await started;
    });
  });

  describe('after exit', () => {
    it('is stopped after natural exit with stoppedAt set', async () => {
      const engine = buildEngine();
      await engine.start();

      expect(engine.status).toBe('stopped');
      expect(engine.snapshot().stoppedAt).toEqual(jasmine.any(Number));
    });

    it('is stopped after stop()', async () => {
      const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
      const started = engine.start();
      engine.stop();
      await started;

      expect(engine.status).toBe('stopped');
      expect(engine.snapshot().stoppedAt).toEqual(jasmine.any(Number));
    });
  });

  describe('when the loop throws', () => {
    let error;

    beforeEach(() => {
      error = new TypeError('boom');
      spyOn(JobRegistry, 'promoteReadyJobs').and.throwError(error);
    });

    it('rejects with the same error, records it and emits crash', async () => {
      const engine = buildEngine({ keepAlive: true });
      const listener = jasmine.createSpy('crash');
      engine.on('crash', listener);

      await expectAsync(engine.start()).toBeRejectedWith(error);

      expect(engine.status).toBe('crashed');
      expect(listener).toHaveBeenCalledWith(error);
      expect(engine.snapshot().lastError).toEqual({
        name: 'TypeError', message: 'boom', at: jasmine.any(Number)
      });
    });

    it('keeps the rejection reason when a crash listener throws', async () => {
      const engine = buildEngine({ keepAlive: true });
      engine.on('crash', () => { throw new Error('listener'); });

      await expectAsync(engine.start()).toBeRejectedWith(error);
    });

    it('runs again after a crash keeping lastError', async () => {
      const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
      await expectAsync(engine.start()).toBeRejectedWith(error);
      const firstStart = engine.snapshot().startedAt;
      await sleep(3);
      JobRegistry.promoteReadyJobs.and.stub();

      const started = engine.start();
      const snap = engine.snapshot();

      expect(snap.status).toBe('running');
      expect(snap.startedAt).toBeGreaterThan(firstStart);
      expect(snap.stoppedAt).toBeNull();
      expect(snap.lastError.message).toBe('boom');

      engine.stop();
      await started;
    });
  });

  describe('#snapshot', () => {
    it('is JSON round-trippable and a fresh object each call', async () => {
      const engine = buildEngine();
      await engine.start();
      const snap = engine.snapshot();

      expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);

      snap.status = 'mutated';
      expect(engine.snapshot().status).toBe('stopped');
    });
  });
});
