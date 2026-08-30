import { JobRegistry, WorkersRegistry } from 'deku-swarm';
import { EmissionRegistry } from '../../../../lib/registry/EmissionRegistry.js';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { NamespaceMap } from '../../../../lib/registry/NamespaceMap.js';
import { ConfigIncluder } from '../../../../lib/services/config/ConfigIncluder.js';
import { EngineController } from '../../../../lib/services/engine/EngineController.js';
import { EngineState } from '../../../../lib/services/engine/EngineState.js';

/**
 * Builds a minimal fake Engine test double that supports the `on`/`emit`
 * listener API, so specs can assert on listener wiring without depending on
 * the real Engine implementation.
 * @param {object} [overrides={}] - Properties to override on the fake engine.
 * @returns {object} The fake engine instance.
 */
function buildFakeEngine(overrides = {}) {
  const handlers = {};

  return {
    start: async () => {},
    pause: () => {},
    resume: () => {},
    stop: () => {},
    on: (eventName, handler) => {
      handlers[eventName] = handler;
    },
    emit: (eventName, ...args) => {
      handlers[eventName]?.(...args);
    },
    ...overrides,
  };
}

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
    controller.engine = { stop: () => {}, pause: () => {}, resume: () => {}, emit: () => {} };

    spyOn(WorkersRegistry, 'hasBusyWorker').and.returnValue(false);
    spyOn(JobRegistry, 'clearQueues').and.stub();
  });

  afterEach(() => {
    JobRegistry.reset();
    LogRegistry.reset();
  });

  describe('#buildEngine', () => {
    beforeEach(() => {
      spyOn(JobRegistry, 'hasReadyJob').and.returnValue(false);
      spyOn(JobRegistry, 'hasJob').and.returnValue(false);
    });

    it('wires web.idle_timeout into the built Engine and calls shutdown() once it expires', async () => {
      // 1ms — idle_timeout=0 means "disabled", so use the smallest enabled value
      const localController = new EngineController({
        state,
        config: { workersConfig: { sleep: -1 }, webConfig: { idleTimeout: 0.001 } },
      });
      spyOn(localController, 'shutdown');

      const engine = localController.buildEngine();

      let iterations = 0;
      spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
        iterations++;
        // stop as soon as shutdown() fired; a generous safety net avoids a
        // hang if the implementation is broken and it never fires at all.
        if (localController.shutdown.calls.count() > 0 || iterations >= 20000) engine.stop();
      });

      await engine.start();

      expect(localController.shutdown).toHaveBeenCalled();
    });

    it('does not shut down before a larger configured idle_timeout has elapsed', async () => {
      const localController = new EngineController({
        state,
        config: { workersConfig: { sleep: -1 }, webConfig: { idleTimeout: 60 } },
      });
      spyOn(localController, 'shutdown');

      const engine = localController.buildEngine();

      let iterations = 0;
      spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
        iterations++;
        if (iterations >= 5) engine.stop();
      });

      await engine.start();

      expect(localController.shutdown).not.toHaveBeenCalled();
    });

    it('disables idle-timeout tracking when there is no web config', async () => {
      const localController = new EngineController({
        state,
        config: { workersConfig: { sleep: -1 } },
      });
      spyOn(localController, 'shutdown');

      const engine = localController.buildEngine();

      let iterations = 0;
      spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
        iterations++;
        if (iterations >= 5) engine.stop();
      });

      await engine.start();

      expect(localController.shutdown).not.toHaveBeenCalled();
    });
  });

  describe('#bind', () => {
    let reporter;
    let localController;

    beforeEach(() => {
      reporter = jasmine.createSpyObj('RunReporter', ['report']);
      localController = new EngineController({
        state,
        config: { failureConfig: { threshold: 30 } },
      });
      localController.engine = buildFakeEngine();
      spyOn(LogRegistry, 'clearBuffers');
      EmissionRegistry.build();
    });

    afterEach(() => {
      EmissionRegistry.reset();
    });

    it('clears the log buffers when the engine emits stop', () => {
      localController.bind(reporter);
      localController.engine.emit('stop');

      expect(LogRegistry.clearBuffers).toHaveBeenCalled();
    });

    it('clears the emission store when the engine emits stop', () => {
      EmissionRegistry.incExtracted(3);
      EmissionRegistry.recordEmission({ status: 'success', url: '/hook', method: 'POST' });
      localController.bind(reporter);

      localController.engine.emit('stop');

      expect(EmissionRegistry.getRecords()).toEqual([]);
      expect(EmissionRegistry.counts).toEqual({ extracted: 0, emitted: 0, failed: 0, dead: 0 });
    });

    it('reports the run outcome when the engine emits finish', () => {
      localController.bind(reporter);
      localController.engine.emit('finish');

      expect(reporter.report).toHaveBeenCalledWith({ failureConfig: { threshold: 30 } });
    });
  });

  describe('.build', () => {
    it('builds an engine and binds the given reporter', () => {
      const configStore = { config: { workersConfig: { sleep: 5 } }, entryFilePath: '/some/path.yml' };
      const reporter = jasmine.createSpyObj('RunReporter', ['report']);
      const fakeEngine = buildFakeEngine();

      spyOn(EngineController.prototype, 'buildEngine').and.returnValue(fakeEngine);
      spyOn(EngineController.prototype, 'bind').and.callThrough();

      const builtController = EngineController.build({
        state,
        configStore,
        sleepMs: 5,
        enqueueResources,
        reporter,
      });

      expect(EngineController.prototype.buildEngine).toHaveBeenCalled();
      expect(EngineController.prototype.bind).toHaveBeenCalledWith(reporter);
      expect(builtController.engine).toBe(fakeEngine);
      expect(builtController.config).toBe(configStore.config);
    });

    it('wires reloadConfig to merge the resolved config include into the NamespaceMap', async () => {
      const configStore = { config: {}, entryFilePath: '/some/path.yml' };
      const reporter = jasmine.createSpyObj('RunReporter', ['report']);
      const localState = new EngineState();
      localState.set('running');

      spyOn(EngineController.prototype, 'buildEngine').and.returnValue(buildFakeEngine());
      spyOn(EngineController.prototype, 'bind').and.stub();
      spyOn(ConfigIncluder, 'resolve').and.returnValue('resolved-config');
      spyOn(NamespaceMap, 'include').and.stub();

      const builtController = EngineController.build({
        state: localState,
        configStore,
        sleepMs: 0,
        enqueueResources,
        reporter,
      });

      await builtController.reload();

      expect(ConfigIncluder.resolve).toHaveBeenCalledWith(configStore.entryFilePath);
      expect(NamespaceMap.include).toHaveBeenCalledWith('resolved-config');
    });
  });

  describe('#start', () => {
    let localController;

    it('when built with shouldAutostart: true, sets state to running and starts without pausing', () => {
      localController = new EngineController({ state, shouldAutostart: true });
      localController.engine = buildFakeEngine({ start: jasmine.createSpy('start').and.returnValue('start-result') });
      spyOn(localController.engine, 'pause');

      const result = localController.start();

      expect(state.get()).toBe('running');
      expect(localController.engine.pause).not.toHaveBeenCalled();
      expect(localController.engine.start).toHaveBeenCalled();
      expect(result).toBe('start-result');
    });

    it('when built with shouldAutostart: false, pauses, sets state to stopped, then starts', () => {
      localController = new EngineController({ state, shouldAutostart: false });
      localController.engine = buildFakeEngine({ start: jasmine.createSpy('start').and.returnValue('start-result') });
      spyOn(localController.engine, 'pause');

      const result = localController.start();

      expect(localController.engine.pause).toHaveBeenCalled();
      expect(state.get()).toBe('stopped');
      expect(localController.engine.start).toHaveBeenCalled();
      expect(result).toBe('start-result');
    });
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

  describe('#resumeProcessing', () => {
    it('starts without creating a new engine', async () => {
      await controller.stop();
      const originalEngine = controller.engine;
      spyOn(controller.engine, 'resume');

      await controller.resumeProcessing();

      expect(controller.engine).toBe(originalEngine);
      expect(controller.engine.resume).toHaveBeenCalled();
      expect(state.get()).toBe('running');
    });

    it('does nothing when not stopped', async () => {
      spyOn(controller.engine, 'resume');

      await controller.resumeProcessing();

      expect(controller.engine.resume).not.toHaveBeenCalled();
      expect(state.get()).toBe('running');
    });

    it('emits a start event on the engine', async () => {
      await controller.stop();
      spyOn(controller.engine, 'emit');
      await controller.resumeProcessing();
      expect(controller.engine.emit).toHaveBeenCalledWith('start');
    });

    it('enqueues the default set when no names are given', async () => {
      await controller.stop();
      await controller.resumeProcessing();
      expect(enqueueResources).toHaveBeenCalledWith([]);
    });

    it('delegates to the injected enqueueResources callback and returns its result', async () => {
      await controller.stop();
      enqueueResources.and.returnValue({ enqueued: ['home_page'], skippedResources: [] });

      const result = await controller.resumeProcessing(['home_page']);

      expect(enqueueResources).toHaveBeenCalledWith(['home_page']);
      expect(result).toEqual({ enqueued: ['home_page'], skippedResources: [] });
    });

    it('returns undefined when not stopped', async () => {
      const result = await controller.resumeProcessing();
      expect(result).toBeUndefined();
    });

    describe('when called with { enqueue: false }', () => {
      it('transitions to running without enqueueing anything', async () => {
        await controller.stop();
        spyOn(controller.engine, 'resume');

        const result = await controller.resumeProcessing([], { enqueue: false });

        expect(controller.engine.resume).toHaveBeenCalled();
        expect(state.get()).toBe('running');
        expect(enqueueResources).not.toHaveBeenCalled();
        expect(result).toEqual({ enqueued: [], skippedResources: [] });
      });

      it('does not call the enqueueResources callback', async () => {
        await controller.stop();

        await controller.resumeProcessing(['home_page'], { enqueue: false });

        expect(enqueueResources).not.toHaveBeenCalled();
      });

      it('still emits a start event on the engine', async () => {
        await controller.stop();
        spyOn(controller.engine, 'emit');

        await controller.resumeProcessing([], { enqueue: false });

        expect(controller.engine.emit).toHaveBeenCalledWith('start');
      });

      it('returns undefined when not stopped', async () => {
        const result = await controller.resumeProcessing([], { enqueue: false });
        expect(result).toBeUndefined();
      });
    });
  });

  describe('#restart', () => {
    it('stops then resumes the engine, in order', async () => {
      spyOn(controller, 'stop').and.callThrough();
      spyOn(controller, 'resumeProcessing').and.callThrough();

      await controller.restart();

      expect(controller.stop).toHaveBeenCalledBefore(controller.resumeProcessing);
      expect(state.get()).toBe('running');
    });

    it('does nothing when not running', async () => {
      state.set('stopped');
      spyOn(controller, 'stop');
      spyOn(controller, 'resumeProcessing');

      await controller.restart();

      expect(controller.stop).not.toHaveBeenCalled();
      expect(controller.resumeProcessing).not.toHaveBeenCalled();
    });
  });

  describe('#reload', () => {
    it('stops then resumes the engine, in order', async () => {
      spyOn(controller, 'stop').and.callThrough();
      spyOn(controller, 'resumeProcessing').and.callThrough();

      await controller.reload();

      expect(controller.stop).toHaveBeenCalledBefore(controller.resumeProcessing);
      expect(state.get()).toBe('running');
    });

    it('calls the injected reloadConfig callback between stop and resumeProcessing', async () => {
      spyOn(controller, 'stop').and.callThrough();
      spyOn(controller, 'resumeProcessing').and.callThrough();

      await controller.reload();

      expect(controller.stop).toHaveBeenCalledBefore(reloadConfig);
      expect(reloadConfig).toHaveBeenCalledBefore(controller.resumeProcessing);
    });

    it('does nothing when not running', async () => {
      state.set('stopped');
      spyOn(controller, 'stop');
      spyOn(controller, 'resumeProcessing');

      await controller.reload();

      expect(controller.stop).not.toHaveBeenCalled();
      expect(controller.resumeProcessing).not.toHaveBeenCalled();
      expect(reloadConfig).not.toHaveBeenCalled();
      expect(state.get()).toBe('stopped');
    });
  });

  describe('#shutdown', () => {
    beforeEach(() => {
      spyOn(controller.engine, 'stop');
    });

    describe('when a server controller is present', () => {
      beforeEach(() => {
        controller.serverController = { shutdown: jasmine.createSpy('shutdown') };
      });

      it('shuts down the server controller', async () => {
        await controller.shutdown();

        expect(controller.serverController.shutdown).toHaveBeenCalled();
      });

      it('stops the engine', async () => {
        await controller.shutdown();

        expect(controller.engine.stop).toHaveBeenCalled();
      });
    });

    describe('when there is no server controller', () => {
      beforeEach(() => {
        controller.serverController = null;
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
      spyOn(controller.engine, 'emit');
    });

    it('sets the state to stopped', () => {
      controller.finishRun();

      expect(state.get()).toBe('stopped');
    });

    it('emits stop and finish events on the engine', () => {
      controller.finishRun();

      expect(controller.engine.emit).toHaveBeenCalledWith('stop');
      expect(controller.engine.emit).toHaveBeenCalledWith('finish');
    });
  });
});
