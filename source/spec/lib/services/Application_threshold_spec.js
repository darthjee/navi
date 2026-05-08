import { JobFactory } from '../../../lib/background/JobFactory.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { Application } from '../../../lib/services/Application.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';
import { DummyJobFactory } from '../../support/dummies/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../../support/dummies/factories/DummyWorkerFactory.js';
import { DummyJob } from '../../support/dummies/models/DummyJob.js';
import { FixturesUtils } from '../../support/utils/FixturesUtils.js';
import { RegistryCleanupUtils } from '../../support/utils/RegistryCleanupUtils.js';

describe('Application failure threshold', () => {
  let app;
  let jobFactory;
  let workerFactory;

  const prepareRunScenario = ({ fixtureName, successRate }) => {
    DummyJob.setSuccessRate(successRate);
    app = Application.build();
    app.loadConfig(FixturesUtils.getFixturePath(fixtureName));
    WorkersRegistry.reset();
    WorkersRegistry.build({ quantity: 1, factory: workerFactory });
    WorkersRegistry.initWorkers();
    JobFactory.registry('ResourceRequestJob', jobFactory);
    spyOn(process, 'exit').and.stub();
  };

  beforeEach(() => {
    Logger.suppress();
    jobFactory = new DummyJobFactory();
    workerFactory = new DummyWorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry });
  });

  afterEach(() => {
    RegistryCleanupUtils.resetApplicationState();
  });

  it('calls process.exit(1) when dead ratio exceeds the configured threshold', async () => {
    prepareRunScenario({ fixtureName: 'config/sample_config_with_failure.yml', successRate: 0 });

    await app.run();

    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('does not call process.exit when dead ratio stays within the threshold', async () => {
    prepareRunScenario({ fixtureName: 'config/sample_config_with_failure.yml', successRate: 1 });

    await app.run();

    expect(process.exit).not.toHaveBeenCalled();
  });

  it('does not call process.exit when no failure threshold is configured', async () => {
    prepareRunScenario({ fixtureName: 'config/sample_config.yml', successRate: 0 });

    await app.run();

    expect(process.exit).not.toHaveBeenCalled();
  });
});
