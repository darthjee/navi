import { JobRegistry } from '../../lib/background/JobRegistry.js';
import { Engine } from '../../lib/services/Engine.js';
import { WorkersAllocator } from '../../lib/services/WorkersAllocator.js';
import { DummyJob } from '../support/dummies/models/DummyJob.js';
import { EngineSpecUtils } from '../support/utils/EngineSpecUtils.js';

describe('Engine', () => {
  const ctx = EngineSpecUtils.setup();
  const { enqueueJobs } = EngineSpecUtils;

  beforeEach(() => {
    spyOn(console, 'error').and.stub();
  });

  describe('#start', () => {
    it('does nothing when there are no jobs to process', async () => {
      expect(JobRegistry.hasJob()).toBeFalse();

      await ctx.engine.start();

      expect(JobRegistry.hasJob()).toBeFalse();
      expect(ctx.finished.size()).toBe(0);
    });

    it('stops immediately when stop() is called before start()', async () => {
      enqueueJobs(2);
      ctx.engine.stop();

      await ctx.engine.start();

      expect(ctx.finished.size()).toBe(0);
    });

    [2, 4].forEach((jobCount) => {
      it(`processes all jobs when ${jobCount} jobs are enqueued`, async () => {
        enqueueJobs(jobCount);

        await ctx.engine.start();

        expect(JobRegistry.hasJob()).toBeFalse();
        expect(ctx.finished.size()).toBe(jobCount);
        expect(ctx.dead.size()).toBe(0);
      });
    });

    it('moves always-failing jobs to the dead queue', async () => {
      DummyJob.setSuccessRate(0);
      enqueueJobs(1);

      await ctx.engine.start();

      expect(JobRegistry.hasJob()).toBeFalse();
      expect(ctx.finished.size()).toBe(0);
      expect(ctx.dead.size()).toBe(1);
    });

    it('finishes or kills jobs that fail intermittently', async () => {
      DummyJob.setSuccessRate(0.1);
      enqueueJobs(20);

      await ctx.engine.start();

      expect(JobRegistry.hasJob()).toBeFalse();
      expect(ctx.finished.size() + ctx.dead.size()).toBe(20);
      expect(ctx.finished.size()).not.toBe(0);
      expect(ctx.dead.size()).not.toBe(0);
    });

    it('calls promoteReadyJobs during processing', async () => {
      enqueueJobs(2);
      spyOn(JobRegistry, 'promoteReadyJobs').and.callThrough();

      await ctx.engine.start();

      expect(JobRegistry.promoteReadyJobs).toHaveBeenCalled();
    });

    it('keeps allocating while jobs cool down', async () => {
      ctx.rebuild({ cooldown: 0 });
      DummyJob.setSuccessRate(0);
      enqueueJobs(1);

      spyOn(ctx.engine.allocator, 'allocate').and.callThrough();

      let callCount = 0;
      spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
        callCount++;
        if (callCount > 3) {
          JobRegistry.promoteReadyJobs.and.callThrough();
        }
      });

      await ctx.engine.start();

      expect(ctx.engine.allocator.allocate).toHaveBeenCalled();
    });
  });

  describe('registry defaults', () => {
    it('defaults the allocator to a WorkersAllocator backed by the singleton facades', () => {
      const defaultEngine = new Engine({ sleepMs: -1 });

      expect(defaultEngine.allocator).toBeInstanceOf(WorkersAllocator);
    });

    it('drives the JobRegistry / WorkersRegistry facades when no registries are injected', async () => {
      const defaultEngine = new Engine({ sleepMs: -1 });
      enqueueJobs(2);
      spyOn(JobRegistry, 'promoteReadyJobs').and.callThrough();

      await defaultEngine.start();

      expect(JobRegistry.promoteReadyJobs).toHaveBeenCalled();
      expect(ctx.finished.size()).toBe(2);
    });

    it('uses an injected registry over the default', async () => {
      spyOn(JobRegistry, 'promoteReadyJobs').and.callThrough();
      const injectedJobRegistry = {
        promoteReadyJobs: jasmine.createSpy('promoteReadyJobs'),
        hasReadyJob: () => false,
        hasJob: () => false,
      };
      const injectedWorkersRegistry = {
        hasBusyWorker: () => false,
      };
      const injectedEngine = new Engine({
        jobRegistry: injectedJobRegistry,
        workersRegistry: injectedWorkersRegistry,
        keepAlive: true,
        sleepMs: -1,
      });
      injectedJobRegistry.promoteReadyJobs.and.callFake(() => injectedEngine.stop());

      await injectedEngine.start();

      expect(injectedJobRegistry.promoteReadyJobs).toHaveBeenCalled();
      expect(JobRegistry.promoteReadyJobs).not.toHaveBeenCalled();
    });
  });

  describe('#on / #emit', () => {
    it('invokes a registered handler, forwarding extra arguments', () => {
      const handler = jasmine.createSpy('handler');
      ctx.engine.on('some-event', handler);

      ctx.engine.emit('some-event', 'arg1', 'arg2');

      expect(handler).toHaveBeenCalledOnceWith('arg1', 'arg2');
    });

    it('invokes multiple handlers registered for the same event in registration order', () => {
      const calls = [];
      ctx.engine.on('some-event', () => calls.push('first'));
      ctx.engine.on('some-event', () => calls.push('second'));

      ctx.engine.emit('some-event');

      expect(calls).toEqual(['first', 'second']);
    });

    it('does not throw when emitting an event with no registered listeners', () => {
      expect(() => ctx.engine.emit('unregistered-event')).not.toThrow();
    });
  });
});
