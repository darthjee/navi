import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { ApplicationInstance } from '../../../lib/services/ApplicationInstance.js';
import { EngineEvents } from '../../../lib/services/EngineEvents.js';
import { FailureChecker } from '../../../lib/services/FailureChecker.js';
import { ResourceEnqueuer } from '../../../lib/utils/ResourceEnqueuer.js';

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

    spyOn(WorkersRegistry, 'hasBusyWorker').and.returnValue(false);
    spyOn(JobRegistry, 'clearQueues').and.stub();
  });

  afterEach(() => {
    JobRegistry.reset();
    LogRegistry.reset();
    EngineEvents.reset();
  });

  describe('#pause', () => {
    it('pauses the engine without stopping it', async () => {
      spyOn(instance.engine, 'pause');
      spyOn(instance.engine, 'stop');

      await instance.pause();

      expect(instance.engine.pause).toHaveBeenCalled();
      expect(instance.engine.stop).not.toHaveBeenCalled();
      expect(instance.status()).toBe('paused');
    });
  });

  describe('#stop', () => {
    it('stops without recreating the engine', async () => {
      const originalEngine = instance.engine;
      spyOn(instance.engine, 'pause');

      await instance.stop();

      expect(instance.engine).toBe(originalEngine);
      expect(instance.engine.pause).toHaveBeenCalled();
      expect(instance.status()).toBe('stopped');
    });

    it('emits a stop event on EngineEvents', async () => {
      spyOn(EngineEvents, 'emit');
      await instance.stop();
      expect(EngineEvents.emit).toHaveBeenCalledWith('stop');
    });
  });

  describe('#continue', () => {
    it('resumes without creating a new engine', async () => {
      await instance.pause();
      const originalEngine = instance.engine;
      spyOn(instance.engine, 'resume');

      await instance.continue();

      expect(instance.engine).toBe(originalEngine);
      expect(instance.engine.resume).toHaveBeenCalled();
      expect(instance.status()).toBe('running');
    });

    it('does nothing when not paused', async () => {
      spyOn(instance.engine, 'resume');

      await instance.continue();

      expect(instance.engine.resume).not.toHaveBeenCalled();
      expect(instance.status()).toBe('running');
    });
  });

  describe('#start', () => {
    beforeEach(() => {
      spyOn(instance, 'enqueueFirstJobs').and.stub();
    });

    it('starts without creating a new engine', async () => {
      await instance.stop();
      const originalEngine = instance.engine;
      spyOn(instance.engine, 'resume');

      await instance.start();

      expect(instance.engine).toBe(originalEngine);
      expect(instance.engine.resume).toHaveBeenCalled();
      expect(instance.status()).toBe('running');
    });

    it('does nothing when not stopped', async () => {
      spyOn(instance.engine, 'resume');

      await instance.start();

      expect(instance.engine.resume).not.toHaveBeenCalled();
      expect(instance.status()).toBe('running');
    });

    it('emits a start event on EngineEvents', async () => {
      await instance.stop();
      spyOn(EngineEvents, 'emit');
      await instance.start();
      expect(EngineEvents.emit).toHaveBeenCalledWith('start');
    });

    it('enqueues the default set when no names are given', async () => {
      await instance.stop();
      await instance.start();
      expect(instance.enqueueFirstJobs).toHaveBeenCalled();
    });

    it('delegates to enqueueResources and returns its result', async () => {
      await instance.stop();
      spyOn(instance, 'enqueueResources').and.returnValue({ enqueued: ['home_page'], skippedResources: [] });

      const result = await instance.start(['home_page']);

      expect(instance.enqueueResources).toHaveBeenCalledWith(['home_page']);
      expect(result).toEqual({ enqueued: ['home_page'], skippedResources: [] });
    });

    it('returns undefined when not stopped', async () => {
      const result = await instance.start();
      expect(result).toBeUndefined();
    });
  });

  describe('#enqueueResources', () => {
    it('falls back to enqueueFirstJobs when no names are given', () => {
      spyOn(instance, 'enqueueFirstJobs').and.stub();

      const result = instance.enqueueResources();

      expect(instance.enqueueFirstJobs).toHaveBeenCalled();
      expect(result).toEqual({ enqueued: [], skippedResources: [] });
    });

    it('delegates named resources to ResourceEnqueuer', () => {
      spyOn(ResourceEnqueuer.prototype, 'enqueue').and.returnValue({ enqueued: ['home_page'], skippedResources: [] });

      const result = instance.enqueueResources(['home_page']);

      expect(ResourceEnqueuer.prototype.enqueue).toHaveBeenCalledWith(['home_page']);
      expect(result).toEqual({ enqueued: ['home_page'], skippedResources: [] });
    });
  });

  describe('#shutdown', () => {
    beforeEach(() => {
      spyOn(instance.engine, 'stop');
    });

    describe('when a web server is present', () => {
      beforeEach(() => {
        instance.webServer = { shutdown: jasmine.createSpy('shutdown') };
      });

      it('shuts down the web server', async () => {
        await instance.shutdown();

        expect(instance.webServer.shutdown).toHaveBeenCalled();
      });

      it('stops the engine', async () => {
        await instance.shutdown();

        expect(instance.engine.stop).toHaveBeenCalled();
      });
    });

    describe('when there is no web server', () => {
      beforeEach(() => {
        instance.webServer = null;
      });

      it('does not throw', async () => {
        await expectAsync(instance.shutdown()).not.toBeRejected();
      });

      it('stops the engine', async () => {
        await instance.shutdown();

        expect(instance.engine.stop).toHaveBeenCalled();
      });
    });
  });

  describe('#run', () => {
    beforeEach(() => {
      instance.config = {
        workersConfig: { sleep: 1 },
        failureConfig: { threshold: 30 },
      };
    });

    it('prints the run summary before checking failures', async () => {
      spyOn(instance, 'buildEngine').and.returnValue({ start: async () => {} });
      spyOn(instance, 'buildWebServer').and.returnValue(null);
      spyOn(instance, 'enqueueFirstJobs').and.stub();
      spyOn(JobRegistry, 'stats').and.returnValue({
        total: 10,
        failed: 1,
        retryQueue: 1,
        dead: 2,
      });
      spyOn(LogRegistry, 'info').and.stub();
      spyOn(FailureChecker.prototype, 'check').and.stub();

      await instance.run();

      expect(LogRegistry.info).toHaveBeenCalledWith(
        'Total: 10\nFailed: 4 (40%)\nThreshold: 30%\nResult: Failure'
      );
      expect(LogRegistry.info).toHaveBeenCalledBefore(FailureChecker.prototype.check);
    });

    describe('when web.autostart is false', () => {
      beforeEach(() => {
        instance.config.webConfig = { autostart: false };
      });

      it('boots paused and stopped instead of enqueueing and running', async () => {
        const engine = { start: async () => {}, pause: jasmine.createSpy('pause') };
        spyOn(instance, 'buildEngine').and.returnValue(engine);
        spyOn(instance, 'buildWebServer').and.returnValue(null);
        spyOn(instance, 'enqueueFirstJobs').and.stub();
        spyOn(JobRegistry, 'stats').and.returnValue({ total: 0, failed: 0, retryQueue: 0, dead: 0 });
        spyOn(LogRegistry, 'info').and.stub();
        spyOn(FailureChecker.prototype, 'check').and.stub();

        await instance.run();

        expect(engine.pause).toHaveBeenCalled();
        expect(instance.enqueueFirstJobs).not.toHaveBeenCalled();
      });
    });
  });
});
