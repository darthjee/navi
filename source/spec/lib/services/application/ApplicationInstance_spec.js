import { JobRegistry, WorkersRegistry } from 'deku-swarm';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { ApplicationInstance } from '../../../../lib/services/application/ApplicationInstance.js';
import { EngineController } from '../../../../lib/services/engine/EngineController.js';

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

describe('ApplicationInstance', () => {
  let instance;

  beforeEach(() => {
    instance = new ApplicationInstance();

    instance.engine = {
      stop: () => {},
      pause: () => {},
      resume: () => {},
    };

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

  describe('#buildEngine', () => {
    beforeEach(() => {
      instance.webServer = null;
      spyOn(JobRegistry, 'hasReadyJob').and.returnValue(false);
      spyOn(JobRegistry, 'hasJob').and.returnValue(false);
      spyOn(WorkersRegistry, 'hasBusyWorker').and.returnValue(false);
    });

    it('wires web.idle_timeout into the built Engine and calls shutdown() once it expires', async () => {
      instance.config = {
        workersConfig: { sleep: -1 },
        webConfig: { idleTimeout: 0.001 }, // 1ms — idle_timeout=0 means "disabled", so use the smallest enabled value
      };
      spyOn(instance, 'shutdown');

      const engine = instance.buildEngine();

      let iterations = 0;
      spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
        iterations++;
        // stop as soon as shutdown() fired; a generous safety net avoids a
        // hang if the implementation is broken and it never fires at all.
        if (instance.shutdown.calls.count() > 0 || iterations >= 20000) engine.stop();
      });

      await engine.start();

      expect(instance.shutdown).toHaveBeenCalled();
    });

    it('does not shut down before a larger configured idle_timeout has elapsed', async () => {
      instance.config = {
        workersConfig: { sleep: -1 },
        webConfig: { idleTimeout: 60 },
      };
      spyOn(instance, 'shutdown');

      const engine = instance.buildEngine();

      let iterations = 0;
      spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
        iterations++;
        if (iterations >= 5) engine.stop();
      });

      await engine.start();

      expect(instance.shutdown).not.toHaveBeenCalled();
    });

    it('disables idle-timeout tracking when there is no web config', async () => {
      instance.config = {
        workersConfig: { sleep: -1 },
      };
      spyOn(instance, 'shutdown');

      const engine = instance.buildEngine();

      let iterations = 0;
      spyOn(JobRegistry, 'promoteReadyJobs').and.callFake(() => {
        iterations++;
        if (iterations >= 5) engine.stop();
      });

      await engine.start();

      expect(instance.shutdown).not.toHaveBeenCalled();
    });
  });

  describe('#run', () => {
    let reporter;

    beforeEach(() => {
      reporter = jasmine.createSpyObj('RunReporter', ['report']);
      instance = new ApplicationInstance({ reporter });
      instance.engine = {
        stop: () => {},
        pause: () => {},
        resume: () => {},
      };
      instance.setStatus('running');
      instance.config = {
        workersConfig: { sleep: 1 },
        failureConfig: { threshold: 30 },
      };
    });

    it('finalizes the run via EngineController once the engine finishes', async () => {
      spyOn(instance, 'buildEngine').and.returnValue(buildFakeEngine());
      spyOn(instance, 'buildWebServer').and.returnValue(null);
      spyOn(instance, 'enqueueFirstJobs').and.stub();
      spyOn(EngineController.prototype, 'finishRun').and.callThrough();

      await instance.run();

      expect(EngineController.prototype.finishRun).toHaveBeenCalled();
      expect(instance.status()).toBe('stopped');
    });

    it('clears the log buffers when the engine emits stop', async () => {
      spyOn(instance, 'buildEngine').and.returnValue(buildFakeEngine());
      spyOn(instance, 'buildWebServer').and.returnValue(null);
      spyOn(instance, 'enqueueFirstJobs').and.stub();
      spyOn(LogRegistry, 'clearBuffers');

      await instance.run();
      instance.engine.emit('stop');

      expect(LogRegistry.clearBuffers).toHaveBeenCalled();
    });

    it('reports the run outcome when the engine emits finish', async () => {
      spyOn(instance, 'buildEngine').and.returnValue(buildFakeEngine());
      spyOn(instance, 'buildWebServer').and.returnValue(null);
      spyOn(instance, 'enqueueFirstJobs').and.stub();

      await instance.run();
      instance.engine.emit('finish');

      expect(reporter.report).toHaveBeenCalledWith({ failureConfig: { threshold: 30 } });
    });

    describe('when web.autostart is false', () => {
      beforeEach(() => {
        instance.config.webConfig = { autostart: false };
      });

      it('boots paused and stopped instead of enqueueing and running', async () => {
        const engine = buildFakeEngine({ pause: jasmine.createSpy('pause') });
        spyOn(instance, 'buildEngine').and.returnValue(engine);
        spyOn(instance, 'buildWebServer').and.returnValue(null);
        spyOn(instance, 'enqueueFirstJobs').and.stub();

        await instance.run();

        expect(engine.pause).toHaveBeenCalled();
        expect(instance.enqueueFirstJobs).not.toHaveBeenCalled();
      });
    });
  });

  describe('delegation to EngineController', () => {
    beforeEach(async () => {
      instance = new ApplicationInstance();
      instance.config = {
        workersConfig: { sleep: 1 },
        failureConfig: {},
      };
      spyOn(instance, 'buildEngine').and.returnValue(buildFakeEngine());
      spyOn(instance, 'buildWebServer').and.returnValue(null);
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

    it('#start delegates to EngineController#start with the given names/options', async () => {
      spyOn(EngineController.prototype, 'start').and.returnValue('start-result');

      const result = await instance.start(['home_page'], { enqueue: false });

      expect(EngineController.prototype.start).toHaveBeenCalledWith(['home_page'], { enqueue: false });
      expect(result).toBe('start-result');
    });

    it('#start defaults names/options when called with no arguments', async () => {
      spyOn(EngineController.prototype, 'start').and.returnValue('start-result');

      await instance.start();

      expect(EngineController.prototype.start).toHaveBeenCalledWith([], {});
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
