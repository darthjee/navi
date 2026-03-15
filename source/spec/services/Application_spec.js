import { Application } from '../../lib/services/Application.js';
import { Config } from '../../lib/models/Config.js';
import { fileURLToPath } from 'node:url';
import { JobRegistry } from '../../lib/registry/JobRegistry.js';
import { WorkersRegistry } from '../../lib/registry/WorkersRegistry.js';

describe('Application', () => {
  let app;
  let configFilePath;

  beforeEach(() => {
    const configPath = '../fixtures/config/sample_config.yml';
    
    configFilePath = fileURLToPath(new URL(configPath, import.meta.url));
    app = new Application();
  });

  describe('#loadConfig', () => {
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
    });
  });
});