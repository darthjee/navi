import { JobFactory } from '../../../lib/factories/JobFactory.js';
import { ClientRegistry } from '../../../lib/registry/ClientRegistry.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { ResourceRegistry } from '../../../lib/registry/ResourceRegistry.js';
import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';
import { Application } from '../../../lib/services/Application.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { DummyJobFactory } from '../../support/dummies/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../../support/dummies/factories/DummyWorkerFactory.js';
import { DummyJob } from '../../support/dummies/models/DummyJob.js';
import { FixturesUtils } from '../../support/utils/FixturesUtils.js';

describe('Application failure threshold', () => {
  let app;
  let configFilePath;
  let jobFactory;
  let workerFactory;

  beforeEach(() => {
    jobFactory = new DummyJobFactory();
    workerFactory = new DummyWorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry });
  });

  afterEach(() => {
    Logger.suppress();
    Logger.reset();
    ClientRegistry.reset();
    JobRegistry.reset();
    JobFactory.reset();
    WorkersRegistry.reset();
    ResourceRegistry.reset();
  });

  describe('when failure threshold is configured and dead ratio exceeds it', () => {
    beforeEach(() => {
      DummyJob.setSuccessRate(0);

      configFilePath = FixturesUtils.getFixturePath('config/sample_config_with_failure.yml');

      app = new Application();
      app.loadConfig(configFilePath);
      WorkersRegistry.reset();
      WorkersRegistry.build({ quantity: 1, factory: workerFactory });
      WorkersRegistry.initWorkers();
      JobFactory.registry('ResourceRequestJob', jobFactory);

      spyOn(process, 'exit').and.stub();
    });

    it('calls process.exit(1)', async () => {
      await app.run();
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  describe('when failure threshold is configured and dead ratio is within it', () => {
    beforeEach(() => {
      DummyJob.setSuccessRate(1);

      configFilePath = FixturesUtils.getFixturePath('config/sample_config_with_failure.yml');

      app = new Application();
      app.loadConfig(configFilePath);
      WorkersRegistry.reset();
      WorkersRegistry.build({ quantity: 1, factory: workerFactory });
      WorkersRegistry.initWorkers();
      JobFactory.registry('ResourceRequestJob', jobFactory);

      spyOn(process, 'exit').and.stub();
    });

    it('does not call process.exit', async () => {
      await app.run();
      expect(process.exit).not.toHaveBeenCalled();
    });
  });

  describe('when no failure threshold is configured', () => {
    beforeEach(() => {
      DummyJob.setSuccessRate(0);

      configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');

      app = new Application();
      app.loadConfig(configFilePath);
      WorkersRegistry.reset();
      WorkersRegistry.build({ quantity: 1, factory: workerFactory });
      WorkersRegistry.initWorkers();
      JobFactory.registry('ResourceRequestJob', jobFactory);

      spyOn(process, 'exit').and.stub();
    });

    it('does not call process.exit', async () => {
      await app.run();
      expect(process.exit).not.toHaveBeenCalled();
    });
  });
});
