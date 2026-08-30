import { JobRegistry } from 'deku-swarm';
import { EmissionRegistry } from '../../../../lib/registry/EmissionRegistry.js';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { ApplicationInstance } from '../../../../lib/services/application/ApplicationInstance.js';
import { EngineController } from '../../../../lib/services/engine/EngineController.js';
import { ServerController } from '../../../../lib/services/engine/ServerController.js';

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

/**
 * Builds an ApplicationInstance whose `config` getter resolves to the given
 * config object, via the `configStore` DI seam.
 * @param {object} config - The config object the `config` getter should return.
 * @param {object} [deps={}] - Extra collaborators forwarded to the constructor.
 * @returns {ApplicationInstance} The constructed instance.
 */
function buildInstanceWithConfig(config, deps = {}) {
  return new ApplicationInstance({ ...deps, configStore: { config } });
}

describe('ApplicationInstance', () => {
  let instance;

  beforeEach(() => {
    instance = new ApplicationInstance();

    instance.setStatus('running');
  });

  afterEach(() => {
    JobRegistry.reset();
    LogRegistry.reset();
  });

  describe('#enqueueFirstJobs', () => {
    it('delegates to ResourceQueueFacade#enqueueFirstJobs', () => {
      const resourceQueueFacade = jasmine.createSpyObj('ResourceQueueFacade', ['enqueueFirstJobs']);
      instance = new ApplicationInstance({ resourceQueueFacade });

      instance.enqueueFirstJobs();

      expect(resourceQueueFacade.enqueueFirstJobs).toHaveBeenCalled();
    });
  });

  describe('#enqueueResources', () => {
    it('delegates to ResourceQueueFacade#enqueueResources and returns its result', () => {
      const resourceQueueFacade = jasmine.createSpyObj('ResourceQueueFacade', {
        enqueueResources: { enqueued: ['home_page'], skippedResources: [] },
      });
      instance = new ApplicationInstance({ resourceQueueFacade });

      const result = instance.enqueueResources(['home_page']);

      expect(resourceQueueFacade.enqueueResources).toHaveBeenCalledWith(['home_page']);
      expect(result).toEqual({ enqueued: ['home_page'], skippedResources: [] });
    });
  });

  describe('#run', () => {
    let reporter;

    beforeEach(() => {
      reporter = jasmine.createSpyObj('RunReporter', ['report']);
      instance = buildInstanceWithConfig(
        { workersConfig: { sleep: 1 }, failureConfig: { threshold: 30 } },
        { reporter },
      );
      instance.setStatus('running');
      spyOn(LogRegistry, 'clearBuffers');
      spyOn(EmissionRegistry, 'clear');
      spyOn(EngineController.prototype, 'buildEngine').and.returnValue(buildFakeEngine());
      spyOn(ServerController.prototype, 'buildWebServer').and.returnValue(null);
      spyOn(instance, 'enqueueFirstJobs').and.stub();
    });

    it('finalizes the run via EngineController once the engine finishes', async () => {
      spyOn(EngineController.prototype, 'finishRun').and.callThrough();

      await instance.run();

      expect(EngineController.prototype.finishRun).toHaveBeenCalled();
      expect(instance.status()).toBe('stopped');
    });

    describe('when web.autostart is false', () => {
      beforeEach(() => {
        instance.config.webConfig = { autostart: false };
      });

      it('boots paused and stopped instead of enqueueing and running', async () => {
        const engine = buildFakeEngine({ pause: jasmine.createSpy('pause') });
        EngineController.prototype.buildEngine.and.returnValue(engine);

        await instance.run();

        expect(engine.pause).toHaveBeenCalled();
        expect(instance.enqueueFirstJobs).not.toHaveBeenCalled();
      });
    });
  });

  describe('delegation to EngineController', () => {
    beforeEach(async () => {
      instance = buildInstanceWithConfig({ workersConfig: { sleep: 1 }, failureConfig: {} });
      spyOn(EngineController.prototype, 'buildEngine').and.returnValue(buildFakeEngine());
      spyOn(ServerController.prototype, 'buildWebServer').and.returnValue(null);
      spyOn(instance, 'enqueueFirstJobs').and.stub();
      spyOn(EngineController.prototype, 'finishRun').and.stub();

      await instance.run();
    });

    it('#pause delegates to EngineController#pause', async () => {
      spyOn(EngineController.prototype, 'pause').and.returnValue('pause-result');

      const result = await instance.pause();

      expect(EngineController.prototype.pause).toHaveBeenCalled();
      expect(result).toBe('pause-result');
    });

    it('#stop delegates to EngineController#stop', async () => {
      spyOn(EngineController.prototype, 'stop').and.returnValue('stop-result');

      const result = await instance.stop();

      expect(EngineController.prototype.stop).toHaveBeenCalled();
      expect(result).toBe('stop-result');
    });

    it('#continue delegates to EngineController#continue', async () => {
      spyOn(EngineController.prototype, 'continue').and.returnValue('continue-result');

      const result = await instance.continue();

      expect(EngineController.prototype.continue).toHaveBeenCalled();
      expect(result).toBe('continue-result');
    });

    it('#start delegates to EngineController#resumeProcessing with the given names/options', async () => {
      spyOn(EngineController.prototype, 'resumeProcessing').and.returnValue('start-result');

      const result = await instance.start(['home_page'], { enqueue: false });

      expect(EngineController.prototype.resumeProcessing).toHaveBeenCalledWith(['home_page'], { enqueue: false });
      expect(result).toBe('start-result');
    });

    it('#start defaults names/options when called with no arguments', async () => {
      spyOn(EngineController.prototype, 'resumeProcessing').and.returnValue('start-result');

      await instance.start();

      expect(EngineController.prototype.resumeProcessing).toHaveBeenCalledWith([], {});
    });

    it('#restart delegates to EngineController#restart', async () => {
      spyOn(EngineController.prototype, 'restart').and.returnValue('restart-result');

      const result = await instance.restart();

      expect(EngineController.prototype.restart).toHaveBeenCalled();
      expect(result).toBe('restart-result');
    });

    it('#reload delegates to EngineController#reload', async () => {
      spyOn(EngineController.prototype, 'reload').and.returnValue('reload-result');

      const result = await instance.reload();

      expect(EngineController.prototype.reload).toHaveBeenCalled();
      expect(result).toBe('reload-result');
    });

    it('#shutdown delegates to EngineController#shutdown', async () => {
      spyOn(EngineController.prototype, 'shutdown').and.returnValue('shutdown-result');

      const result = await instance.shutdown();

      expect(EngineController.prototype.shutdown).toHaveBeenCalled();
      expect(result).toBe('shutdown-result');
    });
  });
});
