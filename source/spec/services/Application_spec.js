import { ConfigurationFileNotFound } from '../../lib/exceptions/ConfigurationFileNotFound.js';
import { ConfigurationFileNotProvided } from '../../lib/exceptions/ConfigurationFileNotProvided.js';
import { Config } from '../../lib/models/Config.js';
import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';
import { Application } from '../../lib/services/Application.js';
import { IdentifyableCollection } from '../../lib/utils/IdentifyableCollection.js'
import { FixturesUtils } from '../support/utils/FixturesUtils.js';
import { DummyJobFactory } from '../support/factories/DummyJobFactory.js';
import { DummyJob } from '../support/models/DummyJob.js';
import { DummyWorkerFactory } from '../support/factories/DummyWorkerFactory.js';

describe('Application', () => {
  let app;
  let configFilePath;
  let config;

  let jobFactory;
  let workersRegistry;
  let jobRegistry;
  let workerFactory;
  let dead;

  describe('#loadConfig', () => {
    beforeEach(() => {
      configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');

      app = new Application();
    });

    describe('when config file is valid', () => {
      it('should initialize config', () => {
        expect(app.config).toBeUndefined();

        app.loadConfig(configFilePath);

        expect(app.config instanceof Config).toBeTrue();
      });

      it('initializes job registry', () => {
        expect(app.jobRegistry).toBeUndefined();

        app.loadConfig(configFilePath);

        expect(app.jobRegistry instanceof JobRegistry).toBeTrue();
      });

      it('initializes workers registry', () => {
        const workers = new IdentifyableCollection();

        app = new Application({ workers });

        expect(app.workersRegistry).toBeUndefined();

        app.loadConfig(configFilePath);

        expect(app.workersRegistry instanceof WorkersRegistry).toBeTrue();
        expect(workers.size()).toEqual(5);
      });
    });

    describe('when config file is invalid', () => {
      it('should throw an error', () => {
        expect(() => app.loadConfig('invalid')).toThrowError(ConfigurationFileNotFound);
      });
    });

    describe('when config file is not given', () => {
      it('should throw an error', () => {
        expect(() => app.loadConfig()).toThrowError(ConfigurationFileNotProvided);
      });
    });
  });

  describe('#run', () => {
    beforeEach(() => {
      DummyJob.setSuccessRate(0);

      configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');
      config = Config.fromFile(configFilePath);

      jobFactory = new DummyJobFactory();
      dead = new IdentifyableCollection();
      jobRegistry = new JobRegistry({ clients: config.clients, factory: jobFactory, dead });

      workerFactory = new DummyWorkerFactory({ jobRegistry });
      workersRegistry = new WorkersRegistry({ quantity: 0, jobRegistry });

      app = new Application();
      app.loadConfig(configFilePath, { workersRegistry, jobRegistry});
    });

    it('initializes the simple jobs', () => {
      app.run();
    });
  });
});