import { JobRegistry, WorkersRegistry } from 'deku-swarm';
import { EmissionRegistry } from '../../../../lib/registry/EmissionRegistry.js';
import { ExtractionRegistry } from '../../../../lib/registry/ExtractionRegistry.js';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { NamespaceMap } from '../../../../lib/registry/namespace/NamespaceMap.js';
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

  /**
   * Shared scenario: the lifecycle method leaves the engine untouched when the
   * controller is running (i.e. not in the state the method resumes from).
   * @param {string} method - Controller method name (`continue`, `resumeProcessing`).
   * @param {string} requiredState - State the method requires, used in the description.
   */
  function itDoesNothingWhenRunning(method, requiredState) {
    it(`does nothing when not ${requiredState}`, async () => {
      spyOn(controller.engine, 'resume');

      await controller[method]();

      expect(controller.engine.resume).not.toHaveBeenCalled();
      expect(state.get()).toBe('running');
    });
  }

  /**
   * Shared scenario: the method stops then resumes the engine, in order.
   * @param {string} method - Controller method name (`restart`, `reload`).
   */
  function itStopsThenResumesInOrder(method) {
    it('stops then resumes the engine, in order', async () => {
      spyOn(controller, 'stop').and.callThrough();
      spyOn(controller, 'resumeProcessing').and.callThrough();

      await controller[method]();

      expect(controller.stop).toHaveBeenCalledBefore(controller.resumeProcessing);
      expect(state.get()).toBe('running');
    });
  }

  /**
   * Shared scenario: the method does nothing when the controller is not running.
   * @param {string} method - Controller method name (`restart`, `reload`).
   */
  function itDoesNothingWhenNotRunning(method) {
    it('does nothing when not running', async () => {
      state.set('stopped');
      spyOn(controller, 'stop');
      spyOn(controller, 'resumeProcessing');

      await controller[method]();

      expect(controller.stop).not.toHaveBeenCalled();
      expect(controller.resumeProcessing).not.toHaveBeenCalled();
      expect(state.get()).toBe('stopped');
    });
  }

  describe('#buildEngine', () => {
    /**
     * Builds an engine from a controller with the given config, spies on the
     * controller `shutdown` and runs the engine until `stopWhen` returns true.
     * @param {object} params - Run parameters.
     * @param {object} params.config - Config given to the EngineController.
     * @param {Function} params.stopWhen - Called on every iteration with
     *   `(iterations, localController)`; the engine stops once it returns true.
     * @returns {Promise<EngineController>} The controller that ran the engine.
     */
    async function runEngineUntil({ config, stopWhen }) {
      const localController = new EngineController({ state, config });
      spyOn(localController, 'shutdown');

      const engine = localController.buildEngine();

      let iterations = 0;
      spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
        iterations++;
        if (stopWhen(iterations, localController)) engine.stop();
      });

      await engine.start();

      return localController;
    }

    const stopAfterFiveIterations = (iterations) => iterations >= 5;

    beforeEach(() => {
      spyOn(JobRegistry, 'hasReadyJob').and.returnValue(false);
      spyOn(JobRegistry, 'hasJob').and.returnValue(false);
    });

    it('wires web.idle_timeout into the built Engine and calls shutdown() once it expires', async () => {
      // 1ms — idle_timeout=0 means "disabled", so use the smallest enabled value
      const localController = await runEngineUntil({
        config: { workersConfig: { sleep: -1 }, webConfig: { idleTimeout: 0.001 } },
        // stop as soon as shutdown() fired; a generous safety net avoids a
        // hang if the implementation is broken and it never fires at all.
        stopWhen: (iterations, { shutdown }) => shutdown.calls.count() > 0 || iterations >= 20000,
      });

      expect(localController.shutdown).toHaveBeenCalled();
    });

    it('does not shut down before a larger configured idle_timeout has elapsed', async () => {
      const localController = await runEngineUntil({
        config: { workersConfig: { sleep: -1 }, webConfig: { idleTimeout: 60 } },
        stopWhen: stopAfterFiveIterations,
      });

      expect(localController.shutdown).not.toHaveBeenCalled();
    });

    it('disables idle-timeout tracking when there is no web config', async () => {
      const localController = await runEngineUntil({
        config: { workersConfig: { sleep: -1 } },
        stopWhen: stopAfterFiveIterations,
      });

      expect(localController.shutdown).not.toHaveBeenCalled();
    });
  });

  describe('#bind', () => {
    let reporter;
    let localController;

    /**
     * One row per store cleared when the engine emits `stop`: `seed` fills the
     * store before binding and `assert` checks it was cleared afterwards.
     */
    const clearedOnStop = [
      {
        description: 'log buffers',
        seed: () => {},
        assert: () => {
          expect(LogRegistry.clearBuffers).toHaveBeenCalled();
        },
      },
      {
        description: 'emission store',
        seed: () => {
          EmissionRegistry.incExtracted(3);
          EmissionRegistry.recordEmission({ status: 'success', url: '/hook', method: 'POST' });
        },
        assert: () => {
          expect(EmissionRegistry.getRecords()).toEqual([]);
          expect(EmissionRegistry.counts).toEqual({ extracted: 0, emitted: 0, failed: 0, dead: 0 });
        },
      },
      {
        description: 'extraction store',
        seed: () => {
          ExtractionRegistry.recordExtraction({ parserType: 'regex', originUrl: '/list', itemCount: 3 });
        },
        assert: () => {
          expect(ExtractionRegistry.getRecords()).toEqual([]);
          expect(ExtractionRegistry.counts).toEqual({ extracted: 0 });
        },
      },
    ];

    beforeEach(() => {
      reporter = jasmine.createSpyObj('RunReporter', ['report']);
      localController = new EngineController({
        state,
        config: { failureConfig: { threshold: 30 } },
      });
      localController.engine = buildFakeEngine();
      spyOn(LogRegistry, 'clearBuffers');
      EmissionRegistry.build();
      ExtractionRegistry.build();
    });

    afterEach(() => {
      EmissionRegistry.reset();
      ExtractionRegistry.reset();
    });

    clearedOnStop.forEach(({ description, seed, assert }) => {
      it(`clears the ${description} when the engine emits stop`, () => {
        seed();
        localController.bind(reporter);

        localController.engine.emit('stop');

        assert();
      });
    });

    it('reports the run outcome when the engine emits finish', () => {
      localController.bind(reporter);
      localController.engine.emit('finish');

      expect(reporter.report).toHaveBeenCalledWith({ failureConfig: { threshold: 30 } });
    });
  });

  describe('.build', () => {
    /**
     * Calls `EngineController.build` with a fresh configStore and reporter.
     * @param {object} params - Build parameters.
     * @param {object} params.config - Config held by the configStore.
     * @param {EngineState} [params.buildState=state] - State given to the build.
     * @param {number} [params.sleepMs=0] - Sleep given to the build.
     * @returns {object} The built controller, the configStore and the reporter.
     */
    function buildController({ config, buildState = state, sleepMs = 0 }) {
      const configStore = { config, entryFilePath: '/some/path.yml' };
      const reporter = jasmine.createSpyObj('RunReporter', ['report']);
      const builtController = EngineController.build({
        state: buildState,
        configStore,
        sleepMs,
        enqueueResources,
        reporter,
      });

      return { builtController, configStore, reporter };
    }

    it('builds an engine and binds the given reporter', () => {
      const fakeEngine = buildFakeEngine();

      spyOn(EngineController.prototype, 'buildEngine').and.returnValue(fakeEngine);
      spyOn(EngineController.prototype, 'bind').and.callThrough();

      const { builtController, configStore, reporter } = buildController({
        config: { workersConfig: { sleep: 5 } },
        sleepMs: 5,
      });

      expect(EngineController.prototype.buildEngine).toHaveBeenCalled();
      expect(EngineController.prototype.bind).toHaveBeenCalledWith(reporter);
      expect(builtController.engine).toBe(fakeEngine);
      expect(builtController.config).toBe(configStore.config);
    });

    it('wires reloadConfig to merge the resolved config include into the NamespaceMap', async () => {
      const localState = new EngineState();
      localState.set('running');

      spyOn(EngineController.prototype, 'buildEngine').and.returnValue(buildFakeEngine());
      spyOn(EngineController.prototype, 'bind').and.stub();
      spyOn(ConfigIncluder, 'resolve').and.returnValue('resolved-config');
      spyOn(NamespaceMap, 'include').and.stub();

      const { builtController, configStore } = buildController({ config: {}, buildState: localState });

      await builtController.reload();

      expect(ConfigIncluder.resolve).toHaveBeenCalledWith(configStore.entryFilePath);
      expect(NamespaceMap.include).toHaveBeenCalledWith('resolved-config');
    });
  });

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
        const localController = new EngineController({ state, shouldAutostart });
        localController.engine = buildFakeEngine({ start: jasmine.createSpy('start').and.returnValue('start-result') });
        spyOn(localController.engine, 'pause');

        const result = localController.start();

        if (pauses) {
          expect(localController.engine.pause).toHaveBeenCalled();
        } else {
          expect(localController.engine.pause).not.toHaveBeenCalled();
        }
        expect(state.get()).toBe(expectedState);
        expect(localController.engine.start).toHaveBeenCalled();
        expect(result).toBe('start-result');
      });
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

    itDoesNothingWhenRunning('continue', 'paused');
  });

  describe('#resumeProcessing', () => {
    /**
     * Stops the controller and then spies on the engine `emit`.
     * @returns {Promise<void>}
     */
    async function stopThenSpyOnEmit() {
      await controller.stop();
      spyOn(controller.engine, 'emit');
    }

    it('starts without creating a new engine', async () => {
      await controller.stop();
      const originalEngine = controller.engine;
      spyOn(controller.engine, 'resume');

      await controller.resumeProcessing();

      expect(controller.engine).toBe(originalEngine);
      expect(controller.engine.resume).toHaveBeenCalled();
      expect(state.get()).toBe('running');
    });

    itDoesNothingWhenRunning('resumeProcessing', 'stopped');

    [
      { suffix: '', args: [] },
      { suffix: ' when called with { enqueue: false }', args: [[], { enqueue: false }] },
    ].forEach(({ suffix, args }) => {
      it(`emits a start event on the engine${suffix}`, async () => {
        await stopThenSpyOnEmit();
        await controller.resumeProcessing(...args);
        expect(controller.engine.emit).toHaveBeenCalledWith('start');
      });

      it(`returns undefined when not stopped${suffix}`, async () => {
        const result = await controller.resumeProcessing(...args);
        expect(result).toBeUndefined();
      });
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
    });
  });

  describe('#restart', () => {
    itStopsThenResumesInOrder('restart');
    itDoesNothingWhenNotRunning('restart');
  });

  describe('#reload', () => {
    itStopsThenResumesInOrder('reload');

    it('calls the injected reloadConfig callback between stop and resumeProcessing', async () => {
      spyOn(controller, 'stop').and.callThrough();
      spyOn(controller, 'resumeProcessing').and.callThrough();

      await controller.reload();

      expect(controller.stop).toHaveBeenCalledBefore(reloadConfig);
      expect(reloadConfig).toHaveBeenCalledBefore(controller.resumeProcessing);
    });

    itDoesNothingWhenNotRunning('reload');

    it('does not call reloadConfig when not running', async () => {
      state.set('stopped');

      await controller.reload();

      expect(reloadConfig).not.toHaveBeenCalled();
    });
  });

  describe('#shutdown', () => {
    /**
     * Shared scenario: shutting down stops the engine.
     */
    function itStopsTheEngine() {
      it('stops the engine', async () => {
        await controller.shutdown();

        expect(controller.engine.stop).toHaveBeenCalled();
      });
    }

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

      itStopsTheEngine();
    });

    describe('when there is no server controller', () => {
      beforeEach(() => {
        controller.serverController = null;
      });

      it('does not throw', async () => {
        await expectAsync(controller.shutdown()).not.toBeRejected();
      });

      itStopsTheEngine();
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
