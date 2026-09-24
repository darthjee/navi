import { EngineControllerExamples } from '../../../support/utils/EngineControllerExamples.js';
import { EngineControllerSpecUtils } from '../../../support/utils/EngineControllerSpecUtils.js';

describe('EngineController', () => {
  const ctx = EngineControllerSpecUtils.setupController();

  describe('#continue', () => {
    it('resumes without creating a new engine', async () => {
      await ctx.controller.pause();
      const originalEngine = ctx.controller.engine;
      spyOn(ctx.controller.engine, 'resume');

      await ctx.controller.continue();

      expect(ctx.controller.engine).toBe(originalEngine);
      expect(ctx.controller.engine.resume).toHaveBeenCalled();
      expect(ctx.state.get()).toBe('running');
    });

    EngineControllerExamples.doesNothingWhenRunning(ctx, 'continue', 'paused');
  });

  describe('#resumeProcessing', () => {
    /**
     * Stops the controller and then spies on the engine `emit`.
     * @returns {Promise<void>}
     */
    async function stopThenSpyOnEmit() {
      await ctx.controller.stop();
      spyOn(ctx.controller.engine, 'emit');
    }

    it('starts without creating a new engine', async () => {
      await ctx.controller.stop();
      const originalEngine = ctx.controller.engine;
      spyOn(ctx.controller.engine, 'resume');

      await ctx.controller.resumeProcessing();

      expect(ctx.controller.engine).toBe(originalEngine);
      expect(ctx.controller.engine.resume).toHaveBeenCalled();
      expect(ctx.state.get()).toBe('running');
    });

    EngineControllerExamples.doesNothingWhenRunning(ctx, 'resumeProcessing', 'stopped');

    [
      { suffix: '', args: [] },
      { suffix: ' when called with { enqueue: false }', args: [[], { enqueue: false }] },
    ].forEach(({ suffix, args }) => {
      it(`emits a start event on the engine${suffix}`, async () => {
        await stopThenSpyOnEmit();
        await ctx.controller.resumeProcessing(...args);
        expect(ctx.controller.engine.emit).toHaveBeenCalledWith('start');
      });

      it(`returns undefined when not stopped${suffix}`, async () => {
        const result = await ctx.controller.resumeProcessing(...args);
        expect(result).toBeUndefined();
      });
    });

    it('enqueues the default set when no names are given', async () => {
      await ctx.controller.stop();
      await ctx.controller.resumeProcessing();
      expect(ctx.enqueueResources).toHaveBeenCalledWith([]);
    });

    it('delegates to the injected enqueueResources callback and returns its result', async () => {
      await ctx.controller.stop();
      ctx.enqueueResources.and.returnValue({ enqueued: ['home_page'], skippedResources: [] });

      const result = await ctx.controller.resumeProcessing(['home_page']);

      expect(ctx.enqueueResources).toHaveBeenCalledWith(['home_page']);
      expect(result).toEqual({ enqueued: ['home_page'], skippedResources: [] });
    });

    describe('when called with { enqueue: false }', () => {
      it('transitions to running without enqueueing anything', async () => {
        await ctx.controller.stop();
        spyOn(ctx.controller.engine, 'resume');

        const result = await ctx.controller.resumeProcessing([], { enqueue: false });

        expect(ctx.controller.engine.resume).toHaveBeenCalled();
        expect(ctx.state.get()).toBe('running');
        expect(ctx.enqueueResources).not.toHaveBeenCalled();
        expect(result).toEqual({ enqueued: [], skippedResources: [] });
      });

      it('does not call the enqueueResources callback', async () => {
        await ctx.controller.stop();

        await ctx.controller.resumeProcessing(['home_page'], { enqueue: false });

        expect(ctx.enqueueResources).not.toHaveBeenCalled();
      });
    });
  });

  describe('#restart', () => {
    EngineControllerExamples.stopsThenResumesInOrder(ctx, 'restart');
    EngineControllerExamples.doesNothingWhenNotRunning(ctx, 'restart');
  });

  describe('#reload', () => {
    EngineControllerExamples.stopsThenResumesInOrder(ctx, 'reload');

    it('calls the injected reloadConfig callback between stop and resumeProcessing', async () => {
      spyOn(ctx.controller, 'stop').and.callThrough();
      spyOn(ctx.controller, 'resumeProcessing').and.callThrough();

      await ctx.controller.reload();

      expect(ctx.controller.stop).toHaveBeenCalledBefore(ctx.reloadConfig);
      expect(ctx.reloadConfig).toHaveBeenCalledBefore(ctx.controller.resumeProcessing);
    });

    EngineControllerExamples.doesNothingWhenNotRunning(ctx, 'reload');

    it('does not call reloadConfig when not running', async () => {
      ctx.state.set('stopped');

      await ctx.controller.reload();

      expect(ctx.reloadConfig).not.toHaveBeenCalled();
    });
  });
});
