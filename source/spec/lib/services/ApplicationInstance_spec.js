import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { ApplicationInstance } from '../../../lib/services/ApplicationInstance.js';
import { EngineEvents } from '../../../lib/services/EngineEvents.js';

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
});
