import { JobFactory } from '../../../lib/background/JobFactory.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { WebServer } from '../../../lib/server/WebServer.js';
import { Application } from '../../../lib/services/Application.js';
import { Engine } from '../../../lib/services/Engine.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { DummyJobFactory } from '../../support/dummies/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../../support/dummies/factories/DummyWorkerFactory.js';
import { DummyJob } from '../../support/dummies/models/DummyJob.js';
import { FixturesUtils } from '../../support/utils/FixturesUtils.js';
import { RegistryCleanupUtils } from '../../support/utils/RegistryCleanupUtils.js';

describe('Application web server integration', () => {
  let app;
  let jobFactory;
  let workerFactory;

  const buildWebEnabledApplication = () => {
    app = Application.build();
    app.loadConfig(FixturesUtils.getFixturePath('config/sample_config_with_web.yml'));
    WorkersRegistry.reset();
    WorkersRegistry.build({ quantity: 1, factory: workerFactory });
    WorkersRegistry.initWorkers();
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

      const webServerPromise = new Promise((resolve) => {
        resolveWebServerStart = resolve;
      });

      spyOn(WebServer.prototype, 'start').and.callFake(() => {
        return webServerPromise.then(() => {
          webServerStartResolved = true;
        });
      });
      spyOn(app, 'buildEngine').and.callFake(() => new Engine({ keepAlive: true, sleepMs: 1 }));

      const runPromise = app.run().then(() => {
        runResolved = true;
      });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(webServerStartResolved).toBeFalse();
      expect(runResolved).toBeFalse();

      resolveWebServerStart();
      app.engine.stop();
      await runPromise;

      expect(webServerStartResolved).toBeTrue();
      expect(runResolved).toBeTrue();
    });
  });
});
