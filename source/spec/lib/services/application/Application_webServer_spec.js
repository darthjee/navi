import { JobFactory, JobRegistry, WorkersRegistry, Engine } from 'deku-swarm';
import { MemoryRegistry } from '../../../../lib/registry/MemoryRegistry.js';
import { WebServer } from '../../../../lib/server/WebServer.js';
import { Application } from '../../../../lib/services/application/Application.js';
import { EngineController } from '../../../../lib/services/engine/EngineController.js';
import { Logger } from '../../../../lib/utils/logging/Logger.js';
import { DummyJobFactory } from '../../../support/dummies/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../../../support/dummies/factories/DummyWorkerFactory.js';
import { DummyJob } from '../../../support/dummies/models/DummyJob.js';
import { FixturesUtils } from '../../../support/utils/FixturesUtils.js';
import { RegistryCleanupUtils } from '../../../support/utils/RegistryCleanupUtils.js';

describe('Application web server integration', () => {
  let app;
  let jobFactory;
  let workerFactory;

  const buildWebEnabledApplication = () => {
    WorkersRegistry.build({ quantity: 1, factory: workerFactory });
    WorkersRegistry.initWorkers();
    app = Application.build();
    app.loadConfig(FixturesUtils.getFixturePath('config/sample_config_with_web.yml'));
    JobFactory.registry('ResourceRequestJob', jobFactory);
  };

  beforeEach(() => {
    Logger.suppress();
    DummyJob.setSuccessRate(1);
    jobFactory = new DummyJobFactory();
    workerFactory = new DummyWorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry });
    buildWebEnabledApplication();
  });

  afterEach(() => {
    RegistryCleanupUtils.resetApplicationState();
  });

  describe('#run', () => {
    it('waits for the web server promise before resolving', async () => {
      let runResolved = false;
      let webServerStartResolved = false;
      let resolveWebServerStart;
      let engine;

      const webServerPromise = new Promise((resolve) => {
        resolveWebServerStart = resolve;
      });

      spyOn(WebServer.prototype, 'start').and.callFake(() => {
        return webServerPromise.then(() => {
          webServerStartResolved = true;
        });
      });
      spyOn(EngineController.prototype, 'buildEngine').and.callFake(() => {
        engine = new Engine({
          jobRegistry: JobRegistry,
          workersRegistry: WorkersRegistry,
          keepAlive: true,
          sleepMs: 1,
        });
        return engine;
      });

      const runPromise = app.run().then(() => {
        runResolved = true;
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(webServerStartResolved).toBeFalse();
      expect(runResolved).toBeFalse();

      resolveWebServerStart();
      engine.stop();
      await runPromise;

      expect(webServerStartResolved).toBeTrue();
      expect(runResolved).toBeTrue();
    });
  });

  describe('memory sampling', () => {
    it('samples RSS while running and stops sampling on shutdown', async () => {
      let resolveWebServerStart;
      let engine;

      const webServerPromise = new Promise((resolve) => {
        resolveWebServerStart = resolve;
      });

      spyOn(WebServer.prototype, 'start').and.returnValue(webServerPromise);
      spyOn(EngineController.prototype, 'buildEngine').and.callFake(() => {
        engine = new Engine({
          jobRegistry: JobRegistry,
          workersRegistry: WorkersRegistry,
          keepAlive: true,
          sleepMs: 1,
        });
        return engine;
      });
      spyOn(MemoryRegistry, 'add').and.callThrough();
      spyOn(globalThis, 'clearInterval').and.callThrough();

      const runPromise = app.run();

      await new Promise((resolve) => setTimeout(resolve, 20));

      expect(MemoryRegistry.add).toHaveBeenCalled();

      resolveWebServerStart();
      engine.stop();
      await runPromise;

      await Application.shutdown();

      expect(globalThis.clearInterval).toHaveBeenCalled();
    });
  });
});
