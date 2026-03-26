import { ConfigurationFileNotFound } from '../../lib/exceptions/ConfigurationFileNotFound.js';
import { ConfigurationFileNotProvided } from '../../lib/exceptions/ConfigurationFileNotProvided.js';
import { Config } from '../../lib/models/Config.js';
import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';
import { Application } from '../../lib/services/Application.js';
import { IdentifyableCollection } from '../../lib/utils/IdentifyableCollection.js';
import { FixturesUtils } from '../support/utils/FixturesUtils.js';

describe('Application', () => {
  let app;
  let configFilePath;
  let config;

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
      configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');
      config = Config.fromFile(configFilePath);

      jobRegistry = new JobRegistry({ clients: config.clients });
      workersRegistry = new WorkersRegistry({ quantity: 5, jobRegistry });

      app = new Application();
      app.loadConfig(configFilePath, { workersRegistry });
    });

    it('initializes the simple jobs', () => {
      expect(jobRegistry.hasJob()).toBeFalse();
      app.run();
      expect(jobRegistry.hasJob()).toBeTrue();
    });
  });
});