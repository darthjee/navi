import { EngineController } from '../../../../lib/services/engine/EngineController.js';
import { FakeEngine } from '../../../support/dummies/services/FakeEngine.js';
import { EngineControllerSpecUtils } from '../../../support/utils/EngineControllerSpecUtils.js';

describe('EngineController', () => {
  const ctx = EngineControllerSpecUtils.setupController();

  describe('#start', () => {
    const scenarios = [
      {
        description: 'when built with shouldAutostart: true, sets state to running and starts without pausing',
        shouldAutostart: true,
        expectedState: 'running',
        pauses: false,
      },
      {
        description: 'when built with shouldAutostart: false, pauses, sets state to stopped, then starts',
        shouldAutostart: false,
        expectedState: 'stopped',
        pauses: true,
      },
    ];

    scenarios.forEach(({ description, shouldAutostart, expectedState, pauses }) => {
      it(description, () => {
        const localController = new EngineController({ state: ctx.state, shouldAutostart });
        localController.engine = FakeEngine.build({ start: jasmine.createSpy('start').and.returnValue('start-result') });
        spyOn(localController.engine, 'pause');

        const result = localController.start();

        if (pauses) {
          expect(localController.engine.pause).toHaveBeenCalled();
        } else {
          expect(localController.engine.pause).not.toHaveBeenCalled();
        }
        expect(ctx.state.get()).toBe(expectedState);
        expect(localController.engine.start).toHaveBeenCalled();
        expect(result).toBe('start-result');
      });
    });
  });

  describe('#pause', () => {
    it('pauses the engine without stopping it', async () => {
      spyOn(ctx.controller.engine, 'pause');
      spyOn(ctx.controller.engine, 'stop');

      await ctx.controller.pause();

      expect(ctx.controller.engine.pause).toHaveBeenCalled();
      expect(ctx.controller.engine.stop).not.toHaveBeenCalled();
      expect(ctx.state.get()).toBe('paused');
    });
  });

  describe('#stop', () => {
    it('stops without recreating the engine', async () => {
      const originalEngine = ctx.controller.engine;
      spyOn(ctx.controller.engine, 'pause');

      await ctx.controller.stop();

      expect(ctx.controller.engine).toBe(originalEngine);
      expect(ctx.controller.engine.pause).toHaveBeenCalled();
      expect(ctx.state.get()).toBe('stopped');
    });

    it('emits a stop event on the engine', async () => {
      spyOn(ctx.controller.engine, 'emit');
      await ctx.controller.stop();
      expect(ctx.controller.engine.emit).toHaveBeenCalledWith('stop');
    });
  });

  describe('#shutdown', () => {
    /**
     * Shared scenario: shutting down stops the engine.
     */
    function itStopsTheEngine() {
      it('stops the engine', async () => {
        await ctx.controller.shutdown();

        expect(ctx.controller.engine.stop).toHaveBeenCalled();
      });
    }

    beforeEach(() => {
      spyOn(ctx.controller.engine, 'stop');
    });

    describe('when a server controller is present', () => {
      beforeEach(() => {
        ctx.controller.serverController = { shutdown: jasmine.createSpy('shutdown') };
      });

      it('shuts down the server controller', async () => {
        await ctx.controller.shutdown();

        expect(ctx.controller.serverController.shutdown).toHaveBeenCalled();
      });

      itStopsTheEngine();
    });

    describe('when there is no server controller', () => {
      beforeEach(() => {
        ctx.controller.serverController = null;
      });

      it('does not throw', async () => {
        await expectAsync(ctx.controller.shutdown()).not.toBeRejected();
      });

      itStopsTheEngine();
    });
  });

  describe('#finishRun', () => {
    beforeEach(() => {
      ctx.controller = new EngineController({
        state: ctx.state,
        config: { failureConfig: { threshold: 30 } },
        enqueueResources: ctx.enqueueResources,
        reloadConfig: ctx.reloadConfig,
      });
      ctx.controller.engine = { emit: () => {} };
      spyOn(ctx.controller.engine, 'emit');
    });

    it('sets the state to stopped', () => {
      ctx.controller.finishRun();

      expect(ctx.state.get()).toBe('stopped');
    });

    it('emits stop and finish events on the engine', () => {
      ctx.controller.finishRun();

      expect(ctx.controller.engine.emit).toHaveBeenCalledWith('stop');
      expect(ctx.controller.engine.emit).toHaveBeenCalledWith('finish');
    });
  });
});
