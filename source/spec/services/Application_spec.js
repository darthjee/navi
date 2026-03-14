import { Application } from '../../lib/services/Application.js';
import { Config } from '../../lib/models/Config.js';

describe('Application', () => {
  let app;
  let configPath;

  beforeEach(() => {
    configPath = '../fixtures/config/sample_config.yml';
    app = new Application();
  });

  describe('#loadConfig', () => {
    it('should initialize config', () => {
      expect(app.config).toBeUndefined();

      app.loadConfig(configPath);

      expect(app.config instanceof Config).toBeTrue();
    });
  });
});