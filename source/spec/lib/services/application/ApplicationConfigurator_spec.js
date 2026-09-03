import { ConfigurationFileNotProvided } from '../../../../lib/exceptions/config/ConfigurationFileNotProvided.js';
import { Config } from '../../../../lib/models/configs/Config.js';
import { EmissionRegistry } from '../../../../lib/registry/EmissionRegistry.js';
import { ExtractionRegistry } from '../../../../lib/registry/ExtractionRegistry.js';
import { LogRegistry } from '../../../../lib/registry/LogRegistry.js';
import { MemoryRegistry } from '../../../../lib/registry/MemoryRegistry.js';
import { NamespaceMap } from '../../../../lib/registry/NamespaceMap.js';
import { ApplicationConfigurator } from '../../../../lib/services/application/ApplicationConfigurator.js';
import { ConfigStore } from '../../../../lib/services/application/ConfigStore.js';
import { FixturesUtils } from '../../../support/utils/FixturesUtils.js';

describe('ApplicationConfigurator', () => {
  let configurator;

  beforeEach(() => {
    configurator = new ApplicationConfigurator();
  });

  afterEach(() => {
    LogRegistry.reset();
    EmissionRegistry.reset();
    ExtractionRegistry.reset();
    MemoryRegistry.reset();
    NamespaceMap.reset();
  });

  describe('#load', () => {
    it('throws ConfigurationFileNotProvided when config path is missing', () => {
      expect(() => configurator.load()).toThrowError(ConfigurationFileNotProvided);
    });

    describe('when the config file is valid', () => {
      let configPath;
      let result;

      beforeEach(() => {
        configPath = FixturesUtils.getFixturePath('config/sample_config.yml');
        result = configurator.load(configPath);
      });

      it('returns a ConfigStore', () => {
        expect(result).toBeInstanceOf(ConfigStore);
      });

      it('returns the loaded config', () => {
        expect(result.config).toBeInstanceOf(Config);
      });

      it('returns a buffered logger with the default retention size', () => {
        expect(result.bufferedLogger.retention).toBe(100);
      });

      it('returns the entry file path passed in', () => {
        expect(result.entryFilePath).toBe(configPath);
      });

      it('builds the emission registry', () => {
        expect(() => EmissionRegistry.getRecords()).not.toThrow();
      });

      it('builds the extraction registry', () => {
        expect(() => ExtractionRegistry.getRecords()).not.toThrow();
      });

      it('does not build the memory registry when there is no web: section', () => {
        expect(() => MemoryRegistry.getEntries()).toThrowError(/not been built/);
      });
    });

    it('uses the configured log size when present', () => {
      const result = configurator.load(FixturesUtils.getFixturePath('config/sample_config_with_log.yml'));

      expect(result.bufferedLogger.retention).toBe(50);
    });

    describe('when the config file has a web: section', () => {
      it('builds the memory registry with the configured dataStoreSize as retention', () => {
        spyOn(MemoryRegistry, 'build').and.callThrough();

        const result = configurator.load(FixturesUtils.getFixturePath('config/sample_config_with_web.yml'));

        expect(MemoryRegistry.build).toHaveBeenCalledWith({ retention: result.config.webConfig.memory.dataStoreSize });
      });

      it('makes the memory registry usable', () => {
        configurator.load(FixturesUtils.getFixturePath('config/sample_config_with_web.yml'));

        expect(() => MemoryRegistry.getEntries()).not.toThrow();
      });
    });
  });
});
