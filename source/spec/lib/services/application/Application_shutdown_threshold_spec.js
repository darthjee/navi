import { Logger } from 'deku-sprout';
import { JobFactory, JobRegistry, WorkersRegistry } from 'deku-swarm';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { WebServer } from '../../../../lib/server/WebServer.js';
import { Application } from '../../../../lib/services/application/Application.js';
import { DummyJobFactory } from '../../../support/dummies/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../../../support/dummies/factories/DummyWorkerFactory.js';
import { DummyJob } from '../../../support/dummies/models/DummyJob.js';
import { FixturesUtils } from '../../../support/utils/FixturesUtils.js';
import { RegistryCleanupUtils } from '../../../support/utils/RegistryCleanupUtils.js';

describe('Application shutdown run summary and threshold', () => {
  const WEB_FIXTURE = 'config/fast_retry_sample_config_with_web_and_failure.yml';
  const IDLE_FIXTURE = 'config/fast_retry_sample_config_with_web_idle_and_failure.yml';

  let app;
  let jobFactory;
  let workerFactory;
  let summaries;

  const prepare = ({ fixtureName, successRate }) => {
    DummyJob.setSuccessRate(successRate);
    WorkersRegistry.build({ quantity: 1, factory: workerFactory });
    WorkersRegistry.initWorkers();
    app = Application.build();
    app.loadConfig(FixturesUtils.getFixturePath(fixtureName));
    JobFactory.registry('ResourceRequestJob', jobFactory);
  };

  const waitFor = async (condition) => {
    for (let i = 0; i < 500 && !condition(); i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  };

  const jobsProcessed = () => JobRegistry.stats().total > 0;

  beforeEach(() => {
    Logger.suppress();
    jobFactory = new DummyJobFactory();
    workerFactory = new DummyWorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry });
    summaries = [];
    spyOn(WebServer.prototype, 'start').and.resolveTo();
    spyOn(WebServer.prototype, 'shutdown').and.resolveTo();
    spyOn(LogRegistry, 'info').and.callFake((message) => summaries.push(message));
    spyOn(process, 'exit').and.stub();
  });

  afterEach(() => {
    RegistryCleanupUtils.resetApplicationState();
  });

  const summary = () => summaries.find((message) => typeof message === 'string' && message.startsWith('Total:'));

  it('reports real counts and fails when the dead ratio exceeds the threshold', async () => {
    prepare({ fixtureName: WEB_FIXTURE, successRate: 0 });
    const runPromise = app.run();

    await waitFor(jobsProcessed);
    await Application.shutdown();
    await runPromise;

    expect(summary()).toMatch(/^Total: [1-9]\d*\n/);
    expect(summary()).toContain('Result: Failure');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('reports real counts and succeeds when the dead ratio is within the threshold', async () => {
    prepare({ fixtureName: WEB_FIXTURE, successRate: 1 });
    const runPromise = app.run();

    await waitFor(jobsProcessed);
    await Application.shutdown();
    await runPromise;

    expect(summary()).toMatch(/^Total: [1-9]\d*\n/);
    expect(summary()).toContain('Result: Success');
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('reports the same outcome when the idle timeout triggers the shutdown', async () => {
    prepare({ fixtureName: IDLE_FIXTURE, successRate: 0 });

    await app.run();

    expect(summary()).toMatch(/^Total: [1-9]\d*\n/);
    expect(summary()).toContain('Result: Failure');
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  it('reports Total: 0 and does not exit when no jobs were processed', async () => {
    prepare({ fixtureName: WEB_FIXTURE, successRate: 0 });
    spyOn(app, 'enqueueFirstJobs').and.stub();
    const runPromise = app.run();

    await new Promise((resolve) => setTimeout(resolve, 20));
    await Application.shutdown();
    await runPromise;

    expect(summary()).toMatch(/^Total: 0\n/);
    expect(process.exit).not.toHaveBeenCalled();
  });
});
