import { ConfigurationFileNotFound } from '../../lib/exceptions/ConfigurationFileNotFound.js';
import { Config } from '../../lib/models/Config.js';
import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';
import { Application } from '../../lib/services/Application.js';
import { FixturesUtils } from '../support/utils/FixturesUtils.js';

describe('Application', () => {
  let app;
  let configFilePath;

  beforeEach(() => {
    configFilePath = FixturesUtils.getFixturePath('config/sample_config.yml');

    app = new Application();
  });

  describe('#loadConfig', () => {
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
        expect(app.workersRegistry).toBeUndefined();

        app.loadConfig(configFilePath);

        expect(app.workersRegistry instanceof WorkersRegistry).toBeTrue();
        expect(Object.keys(app.workersRegistry.workers).length).toEqual(5);
        expect(app.workersRegistry.busy).toEqual({});
      });
    });

    describe('when config file is invalid', () => {
      it('should throw an error', () => {
        expect(() => app.loadConfig('invalid')).toThrow(ConfigurationFileNotFound);
      });
    });
  });
});