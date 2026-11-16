import { JobRegistry } from '../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../lib/background/WorkersRegistry.js';
import { EngineSpecUtils } from '../support/utils/EngineSpecUtils.js';

describe('Engine', () => {
  const { buildEngine, enqueueJobs } = EngineSpecUtils;

  EngineSpecUtils.setup();

  let busy;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const queueSnapshot = () => ['enqueued', 'retryQueue', 'failed'].map(
    status => JobRegistry.jobsByStatus(status).map(job => job.id)
  );

  beforeEach(() => {
    busy = false;
    spyOn(WorkersRegistry, 'hasBusyWorker').and.callFake(() => busy);
  });

  describe('#shutdown', () => {
    describe('when keepAlive is true and a worker is busy', () => {
      it('resolves true and ends start() once the worker finishes', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
        busy = true;
        const started = engine.start();
        const result = engine.shutdown({ timeoutMs: 5000 });
        setTimeout(() => { busy = false; }, 10);

        expect(await result).toBe(true);
        await expectAsync(started).toBeResolved();
      });
    });

    describe('when the worker never finishes', () => {
      it('resolves false on timeout and start() still resolves', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
        busy = true;
        const started = engine.start();

        expect(await engine.shutdown({ timeoutMs: 20 })).toBe(false);
        await expectAsync(started).toBeResolved();
      });
    });

    describe('when the pool is already idle', () => {
      it('resolves true', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
        const started = engine.start();

        expect(await engine.shutdown({ timeoutMs: 1000 })).toBe(true);
        await started;
      });
    });

    describe('queue contents', () => {
      it('leaves queues unchanged and start() resolves with jobs still queued', async () => {
        enqueueJobs(2);
        const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
        spyOn(engine.allocator, 'allocate');
        busy = true;
        const started = engine.start();
        const before = queueSnapshot();
        const result = engine.shutdown({ timeoutMs: 1000 });
        setTimeout(() => { busy = false; }, 10);

        await result;
        await started;

        expect(queueSnapshot()).toEqual(before);
        expect(JobRegistry.hasJob()).toBe(true);
      });
    });

    describe('during the drain window', () => {
      it('does not promote jobs or allocate', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
        spyOn(JobRegistry, 'promoteReadyJobs');
        spyOn(engine.allocator, 'allocate');
        busy = true;
        const started = engine.start();
        const promoted = JobRegistry.promoteReadyJobs.calls.count();
        const result = engine.shutdown({ timeoutMs: 1000 });
        setTimeout(() => { busy = false; }, 15);

        await result;
        await started;

        expect(JobRegistry.promoteReadyJobs.calls.count()).toBe(promoted);
        expect(engine.allocator.allocate).not.toHaveBeenCalled();
      });
    });

    describe('when called twice', () => {
      it('returns the same promise and does not reset the timeout', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
        busy = true;
        const started = engine.start();
        const first = engine.shutdown({ timeoutMs: 30 });
        await sleep(10);
        const second = engine.shutdown({ timeoutMs: 100000 });

        expect(second).toBe(first);
        expect(await second).toBe(false);
        await started;
      });
    });

    describe('when called before start()', () => {
      it('resolves with the pool state and does not start the loop', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
        spyOn(JobRegistry, 'promoteReadyJobs');

        expect(await engine.shutdown({ timeoutMs: 100 })).toBe(true);
        expect(JobRegistry.promoteReadyJobs).not.toHaveBeenCalled();
      });

      it('resolves false when a worker is busy', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
        busy = true;

        expect(await engine.shutdown({ timeoutMs: 100 })).toBe(false);
      });
    });

    describe('when timeoutMs is omitted or 0', () => {
      it('resolves true immediately when idle', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
        const started = engine.start();

        expect(await engine.shutdown()).toBe(true);
        await started;
      });

      it('resolves false immediately when busy, and the loop exits', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
        busy = true;
        const started = engine.start();

        expect(await engine.shutdown({ timeoutMs: 0 })).toBe(false);
        await expectAsync(started).toBeResolved();
      });
    });

    describe('after stop()', () => {
      it('resolves immediately with the pool state', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
        const started = engine.start();
        engine.stop();
        await started;

        expect(await engine.shutdown({ timeoutMs: 1000 })).toBe(true);
        busy = true;
        expect(await buildEngine().shutdown({ timeoutMs: 1000 })).toBe(false);
      });
    });

    describe('when stop() is called during a drain', () => {
      it('resolves the pending shutdown with the pool state at that moment', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 1 });
        busy = true;
        const started = engine.start();
        const result = engine.shutdown({ timeoutMs: 100000 });
        setTimeout(() => engine.stop(), 10);

        expect(await result).toBe(false);
        await started;
      });
    });
  });
});
