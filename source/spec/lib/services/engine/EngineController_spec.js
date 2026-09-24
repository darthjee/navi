import { JobRegistry } from 'deku-swarm';
import { EmissionRegistry } from '../../../../lib/registry/EmissionRegistry.js';
import { ExtractionRegistry } from '../../../../lib/registry/ExtractionRegistry.js';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { NamespaceMap } from '../../../../lib/registry/namespace/NamespaceMap.js';
import { ConfigIncluder } from '../../../../lib/services/config/ConfigIncluder.js';
import { EngineController } from '../../../../lib/services/engine/EngineController.js';
import { EngineState } from '../../../../lib/services/engine/EngineState.js';
import { FakeEngine } from '../../../support/dummies/services/FakeEngine.js';
import { EngineControllerExamples } from '../../../support/utils/EngineControllerExamples.js';
import { EngineControllerSpecUtils } from '../../../support/utils/EngineControllerSpecUtils.js';

describe('EngineController', () => {
  const ctx = EngineControllerSpecUtils.setupController();

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
      const localController = new EngineController({ state: ctx.state, config });
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
        state: ctx.state,
        config: { failureConfig: { threshold: 30 } },
      });
      localController.engine = FakeEngine.build();
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
    function buildController({ config, buildState = ctx.state, sleepMs = 0 }) {
      const configStore = { config, entryFilePath: '/some/path.yml' };
      const reporter = jasmine.createSpyObj('RunReporter', ['report']);
      const builtController = EngineController.build({
        state: buildState,
        configStore,
        sleepMs,
        enqueueResources: ctx.enqueueResources,
        reporter,
      });

      return { builtController, configStore, reporter };
    }

    it('builds an engine and binds the given reporter', () => {
      const fakeEngine = FakeEngine.build();

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

      spyOn(EngineController.prototype, 'buildEngine').and.returnValue(FakeEngine.build());
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
