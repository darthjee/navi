import { ConfigurationFileNotFound } from '../../lib/exceptions/ConfigurationFileNotFound.js';
import { ConfigurationFileNotProvided } from '../../lib/exceptions/ConfigurationFileNotProvided.js';
import { Config } from '../../lib/models/Config.js';
import { ClientRegistry } from '../../lib/registry/ClientRegistry.js';
import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';
import { WebServer } from '../../lib/server/WebServer.js';
import { Application } from '../../lib/services/Application.js';
import { IdentifyableCollection } from '../../lib/utils/IdentifyableCollection.js';
import { DummyJobFactory } from '../support/dummies/factories/DummyJobFactory.js';
import { DummyWorkerFactory } from '../support/dummies/factories/DummyWorkerFactory.js';
import { DummyJob } from '../support/dummies/models/DummyJob.js';
import { FixturesUtils } from '../support/utils/FixturesUtils.js';

describe('Application', () => {
  let app;
  let configFilePath;
  let config;

  let jobFactory;
  let workerFactory;
  let workersRegistry;
  let jobRegistry;

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

      it('initializes job registry with clientRegistry from config', () => {
        app.loadConfig(configFilePath);

        expect(app.jobRegistry instanceof JobRegistry).toBeTrue();
        expect(app.config.clientRegistry instanceof ClientRegistry).toBeTrue();
      });

      it('does not expose a clients property on config (uses clientRegistry instead)', () => {
        app.loadConfig(configFilePath);

        expect(app.config.clients).toBeUndefined();
        expect(app.config.clientRegistry).toBeDefined();
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
      DummyJob.setSuccessRate(1);

      configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');
      config = Config.fromFile(configFilePath);

      jobFactory = new DummyJobFactory();
      jobRegistry = new JobRegistry({ clients: config.clientRegistry, factory: jobFactory });

      workerFactory = new DummyWorkerFactory({ jobRegistry });
      workersRegistry = new WorkersRegistry({ quantity: 1, jobRegistry, factory: workerFactory });

      app = new Application();
      app.loadConfig(configFilePath, { workersRegistry, jobRegistry });
    });

    it('processes all initial parameter-free jobs', () => {
      app.run();
      expect(jobRegistry.hasJob()).toBeFalse();
    });

    it('sets webServer to null when no web config present', () => {
      app.run();
      expect(app.webServer).toBeNull();
    });
  });

  describe('#buildWebServer', () => {
    describe('when config has no web key', () => {
      beforeEach(() => {
        configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');
        app = new Application();
        app.loadConfig(configFilePath);
      });

      it('returns null', () => {
        expect(app.buildWebServer()).toBeNull();
      });
    });

    describe('when config has a web key', () => {
      beforeEach(() => {
        configFilePath = FixturesUtils.getFixturePath('config/sample_config_with_web.yml');
        app = new Application();
        app.loadConfig(configFilePath);
      });

      it('returns a WebServer instance', () => {
        expect(app.buildWebServer() instanceof WebServer).toBeTrue();
      });
    });
  });
});