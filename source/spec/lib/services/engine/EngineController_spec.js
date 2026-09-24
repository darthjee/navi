import { JobRegistry } from 'deku-swarm';
import { EmissionRegistry } from '../../../../lib/registry/EmissionRegistry.js';
import { ExtractionRegistry } from '../../../../lib/registry/ExtractionRegistry.js';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { NamespaceMap } from '../../../../lib/registry/namespace/NamespaceMap.js';
import { ConfigIncluder } from '../../../../lib/services/config/ConfigIncluder.js';
import { EngineController } from '../../../../lib/services/engine/EngineController.js';
import { EngineState } from '../../../../lib/services/engine/EngineState.js';
import { FakeEngine } from '../../../support/dummies/services/FakeEngine.js';
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
});
