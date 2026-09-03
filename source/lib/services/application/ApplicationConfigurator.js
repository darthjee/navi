import { ConfigStore } from './ConfigStore.js';
import { ConfigurationFileNotProvided } from '../../exceptions/config/ConfigurationFileNotProvided.js';
import { Config } from '../../models/configs/Config.js';
import { EmissionRegistry } from '../../registry/EmissionRegistry.js';
import { ExtractionRegistry } from '../../registry/ExtractionRegistry.js';
import { LogRegistry } from '../../registry/LogRegistry.js';
import { MemoryRegistry } from '../../registry/MemoryRegistry.js';

/**
 * ApplicationConfigurator loads the application configuration from disk and
 * bootstraps the log, emission, extraction and memory registries that depend on it.
 * @author darthjee
 */
class ApplicationConfigurator {
  /**
   * Loads the configuration from the specified file path and builds the log registry.
   * @param {string} configPath - The path to the configuration file.
   * @throws {ConfigurationFileNotProvided} If the configuration file path is not provided.
   * @throws {ConfigurationFileNotFound} If the configuration file is not found at the specified path.
   * @returns {ConfigStore} The loaded config, its buffered logger, and the entry file path.
   */
  load(configPath) {
    if (!configPath) {
      throw new ConfigurationFileNotProvided();
    }

    const config = Config.fromFile(configPath);
    const logRegistry = LogRegistry.build({ retention: config.logConfig.size });
    EmissionRegistry.build({ retention: config.emitConfig.size });
    ExtractionRegistry.build({ retention: config.extractionConfig.size });

    if (config.webConfig) {
      MemoryRegistry.build({ retention: config.webConfig.memory.dataStoreSize });
    }

    return new ConfigStore({
      config,
      bufferedLogger: logRegistry.bufferedLogger,
      entryFilePath: configPath,
    });
  }
}

export { ApplicationConfigurator };
