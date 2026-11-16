import { JobRegistry } from '../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../lib/background/WorkersRegistry.js';
import { EngineSpecUtils } from '../support/utils/EngineSpecUtils.js';

describe('Engine', () => {
  const { buildEngine } = EngineSpecUtils;

  EngineSpecUtils.setup();

  let busy;
  let ticks;

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  beforeEach(() => {
    busy = false;
    ticks = 0;
    spyOn(WorkersRegistry, 'hasBusyWorker').and.callFake(() => busy);
    spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => { ticks++; });
  });

  describe('#wake', () => {
    describe('when the loop is sleeping', () => {
      it('runs the next tick right away', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 10_000 });
        const started = engine.start();
        await sleep(5);
        expect(ticks).toBe(1);

        engine.wake();
        await sleep(5);
        expect(ticks).toBe(2);

        engine.stop();
        engine.wake();
        await started;
      });

      it('drains quickly during a shutdown', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 10_000 });
        busy = true;
        const started = engine.start();
        await sleep(5);

        const result = engine.shutdown({ timeoutMs: 20_000 });
        setTimeout(() => { busy = false; engine.wake(); }, 10);

        expect(await result).toBe(true);
        await expectAsync(started).toBeResolved();
      });
    });

    describe('when called mid-tick', () => {
      it('makes the following sleep return immediately once', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 10_000 });
        let woken = false;
        spyOn(engine.allocator, 'allocate').and.callFake(() => {
          if (woken) return;
          woken = true;
          engine.wake();
        });
        spyOn(JobRegistry, 'hasReadyJob').and.returnValue(true);

        const started = engine.start();
        await sleep(10);

        expect(ticks).toBe(2);

        engine.stop();
        engine.wake();
        await started;
      });
    });

    describe('when the loop is not running', () => {
      it('is a no-op before start() and does not carry a latch', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 10_000 });
        expect(() => engine.wake()).not.toThrow();
        expect(engine.status).toBe('idle');

        const started = engine.start();
        await sleep(5);
        expect(ticks).toBe(1);

        engine.stop();
        engine.wake();
        await started;
      });

      it('is a no-op after the loop exited', async () => {
        const engine = buildEngine({ keepAlive: true, sleepMs: 10_000 });
        const started = engine.start();
        await sleep(5);
        engine.stop();
        engine.wake();
        await started;

        expect(() => engine.wake()).not.toThrow();
        expect(engine.status).toBe('stopped');
      });
    });
  });
});
