import { JobRegistry, WorkersRegistry } from 'deku-swarm';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { EngineController } from '../../../../lib/services/engine/EngineController.js';
import { EngineState } from '../../../../lib/services/engine/EngineState.js';

describe('EngineController', () => {
  let controller;
  let state;
  let enqueueResources;
  let reloadConfig;

  beforeEach(() => {
    state = new EngineState();
    state.set('running');

    enqueueResources = jasmine.createSpy('enqueueResources').and.returnValue({ enqueued: [], skippedResources: [] });
    reloadConfig = jasmine.createSpy('reloadConfig');

    controller = new EngineController({ state, sleepMs: 0, enqueueResources, reloadConfig });
    controller.engine = {
      stop: () => {},
      pause: () => {},
      resume: () => {},
      emit: () => {},
    };

    spyOn(WorkersRegistry, 'hasBusyWorker').and.returnValue(false);
    spyOn(JobRegistry, 'clearQueues').and.stub();
  });

  afterEach(() => {
    JobRegistry.reset();
    LogRegistry.reset();
  });

  describe('#pause', () => {
    it('pauses the engine without stopping it', async () => {
      spyOn(controller.engine, 'pause');
      spyOn(controller.engine, 'stop');

      await controller.pause();

      expect(controller.engine.pause).toHaveBeenCalled();
      expect(controller.engine.stop).not.toHaveBeenCalled();
      expect(state.get()).toBe('paused');
    });
  });

  describe('#stop', () => {
    it('stops without recreating the engine', async () => {
      const originalEngine = controller.engine;
      spyOn(controller.engine, 'pause');

      await controller.stop();

      expect(controller.engine).toBe(originalEngine);
      expect(controller.engine.pause).toHaveBeenCalled();
      expect(state.get()).toBe('stopped');
    });

    it('emits a stop event on the engine', async () => {
      spyOn(controller.engine, 'emit');
      await controller.stop();
      expect(controller.engine.emit).toHaveBeenCalledWith('stop');
    });
  });

  describe('#continue', () => {
    it('resumes without creating a new engine', async () => {
      await controller.pause();
      const originalEngine = controller.engine;
      spyOn(controller.engine, 'resume');

      await controller.continue();

      expect(controller.engine).toBe(originalEngine);
      expect(controller.engine.resume).toHaveBeenCalled();
      expect(state.get()).toBe('running');
    });

    it('does nothing when not paused', async () => {
      spyOn(controller.engine, 'resume');

      await controller.continue();

      expect(controller.engine.resume).not.toHaveBeenCalled();
      expect(state.get()).toBe('running');
    });
  });

  describe('#start', () => {
    it('starts without creating a new engine', async () => {
      await controller.stop();
      const originalEngine = controller.engine;
      spyOn(controller.engine, 'resume');

      await controller.start();

      expect(controller.engine).toBe(originalEngine);
      expect(controller.engine.resume).toHaveBeenCalled();
      expect(state.get()).toBe('running');
    });

    it('does nothing when not stopped', async () => {
      spyOn(controller.engine, 'resume');

      await controller.start();

      expect(controller.engine.resume).not.toHaveBeenCalled();
      expect(state.get()).toBe('running');
    });

    it('emits a start event on the engine', async () => {
      await controller.stop();
      spyOn(controller.engine, 'emit');
      await controller.start();
      expect(controller.engine.emit).toHaveBeenCalledWith('start');
    });

    it('enqueues the default set when no names are given', async () => {
      await controller.stop();
      await controller.start();
      expect(enqueueResources).toHaveBeenCalledWith([]);
    });

    it('delegates to the injected enqueueResources callback and returns its result', async () => {
      await controller.stop();
      enqueueResources.and.returnValue({ enqueued: ['home_page'], skippedResources: [] });

      const result = await controller.start(['home_page']);

      expect(enqueueResources).toHaveBeenCalledWith(['home_page']);
      expect(result).toEqual({ enqueued: ['home_page'], skippedResources: [] });
    });

    it('returns undefined when not stopped', async () => {
      const result = await controller.start();
      expect(result).toBeUndefined();
    });

    describe('when called with { enqueue: false }', () => {
      it('transitions to running without enqueueing anything', async () => {
        await controller.stop();
        spyOn(controller.engine, 'resume');

        const result = await controller.start([], { enqueue: false });

        expect(controller.engine.resume).toHaveBeenCalled();
        expect(state.get()).toBe('running');
        expect(enqueueResources).not.toHaveBeenCalled();
        expect(result).toEqual({ enqueued: [], skippedResources: [] });
      });

      it('does not call the enqueueResources callback', async () => {
        await controller.stop();

        await controller.start(['home_page'], { enqueue: false });

        expect(enqueueResources).not.toHaveBeenCalled();
      });

      it('still emits a start event on the engine', async () => {
        await controller.stop();
        spyOn(controller.engine, 'emit');

        await controller.start([], { enqueue: false });

        expect(controller.engine.emit).toHaveBeenCalledWith('start');
      });

      it('returns undefined when not stopped', async () => {
        const result = await controller.start([], { enqueue: false });
        expect(result).toBeUndefined();
      });
    });
  });

  describe('#restart', () => {
    it('stops then starts the engine, in order', async () => {
      spyOn(controller, 'stop').and.callThrough();
      spyOn(controller, 'start').and.callThrough();

      await controller.restart();

      expect(controller.stop).toHaveBeenCalledBefore(controller.start);
      expect(state.get()).toBe('running');
    });

    it('does nothing when not running', async () => {
      state.set('stopped');
      spyOn(controller, 'stop');
      spyOn(controller, 'start');

      await controller.restart();

      expect(controller.stop).not.toHaveBeenCalled();
      expect(controller.start).not.toHaveBeenCalled();
    });
  });

  describe('#reload', () => {
    it('stops then starts the engine, in order', async () => {
      spyOn(controller, 'stop').and.callThrough();
      spyOn(controller, 'start').and.callThrough();

      await controller.reload();

      expect(controller.stop).toHaveBeenCalledBefore(controller.start);
      expect(state.get()).toBe('running');
    });

    it('calls the injected reloadConfig callback between stop and start', async () => {
      spyOn(controller, 'stop').and.callThrough();
      spyOn(controller, 'start').and.callThrough();

      await controller.reload();

      expect(controller.stop).toHaveBeenCalledBefore(reloadConfig);
      expect(reloadConfig).toHaveBeenCalledBefore(controller.start);
    });

    it('does nothing when not running', async () => {
      state.set('stopped');
      spyOn(controller, 'stop');
      spyOn(controller, 'start');

      await controller.reload();

      expect(controller.stop).not.toHaveBeenCalled();
      expect(controller.start).not.toHaveBeenCalled();
      expect(reloadConfig).not.toHaveBeenCalled();
      expect(state.get()).toBe('stopped');
    });
  });

  describe('#shutdown', () => {
    beforeEach(() => {
      spyOn(controller.engine, 'stop');
    });

    describe('when a web server is present', () => {
      beforeEach(() => {
        controller.webServer = { shutdown: jasmine.createSpy('shutdown') };
      });

      it('shuts down the web server', async () => {
        await controller.shutdown();

        expect(controller.webServer.shutdown).toHaveBeenCalled();
      });

      it('stops the engine', async () => {
        await controller.shutdown();

        expect(controller.engine.stop).toHaveBeenCalled();
      });
    });

    describe('when there is no web server', () => {
      beforeEach(() => {
        controller.webServer = null;
      });

      it('does not throw', async () => {
        await expectAsync(controller.shutdown()).not.toBeRejected();
      });

      it('stops the engine', async () => {
        await controller.shutdown();

        expect(controller.engine.stop).toHaveBeenCalled();
      });
    });
  });

  describe('#finishRun', () => {
    beforeEach(() => {
      controller = new EngineController({
        state,
        config: { failureConfig: { threshold: 30 } },
        enqueueResources,
        reloadConfig,
      });
      controller.engine = { emit: () => {} };
    });

    it('sets the state to stopped', () => {
      controller.finishRun();

      expect(state.get()).toBe('stopped');
    });

    it('emits a stop event on the engine', () => {
      spyOn(controller.engine, 'emit');

      controller.finishRun();

      expect(controller.engine.emit).toHaveBeenCalledWith('stop');
    });

    it('emits a finish event on the engine', () => {
      spyOn(controller.engine, 'emit');

      controller.finishRun();

      expect(controller.engine.emit).toHaveBeenCalledWith('finish');
    });
  });
});
