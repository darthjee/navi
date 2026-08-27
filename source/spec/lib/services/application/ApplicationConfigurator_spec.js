import { ConfigurationFileNotProvided } from '../../../../lib/exceptions/config/ConfigurationFileNotProvided.js';
import { Config } from '../../../../lib/models/configs/Config.js';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { NamespaceMap } from '../../../../lib/registry/NamespaceMap.js';
import { ApplicationConfigurator } from '../../../../lib/services/application/ApplicationConfigurator.js';
import { FixturesUtils } from '../../../support/utils/FixturesUtils.js';

describe('ApplicationConfigurator', () => {
  let configurator;

  beforeEach(() => {
    configurator = new ApplicationConfigurator();
  });

  afterEach(() => {
    LogRegistry.reset();
    NamespaceMap.reset();
  });

  describe('#load', () => {
    it('throws ConfigurationFileNotProvided when config path is missing', () => {
      expect(() => configurator.load()).toThrowError(ConfigurationFileNotProvided);
    });

    describe('when the config file is valid', () => {
      let result;

      beforeEach(() => {
        result = configurator.load(FixturesUtils.getFixturePath('config/sample_config.yml'));
      });

      it('returns the loaded config', () => {
        expect(result.config).toBeInstanceOf(Config);
      });

      it('returns a buffered logger with the default retention size', () => {
        expect(result.bufferedLogger.retention).toBe(100);
      });
    });

    it('uses the configured log size when present', () => {
      const result = configurator.load(FixturesUtils.getFixturePath('config/sample_config_with_log.yml'));

      expect(result.bufferedLogger.retention).toBe(50);
    });
  });
});
