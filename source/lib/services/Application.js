import { ConfigurationFileNotProvided } from '../exceptions/ConfigurationFileNotProvided.js';
import { Config } from '../models/Config.js';
import { JobRegistry } from '../registry/JobRegistry.js';
import { WorkersRegistry } from '../registry/WorkersRegistry.js';

class Application {
  #workers;

  /**
   * Creates a new Application instance.
   * @param {object} [params={}] - Optional parameters for dependency injection.
   * @param {IdentifyableCollection} [params.workers] - Workers collection (injected for testing).
   */
  constructor({ workers } = {}) {
    this.#workers = workers;
  }

  /**
   * Loads the configuration from the specified file path.
   * @param {string} configPath - The path to the configuration file.
   * @throws {ConfigurationFileNotProvided} If the configuration file path is not provided.
   * @throws {ConfigurationFileNotFound} If the configuration file is not found at the specified path.
   * @returns {void}
   */
  loadConfig(configPath) {
    if (!configPath) {
      throw new ConfigurationFileNotProvided();
    }

    // Load the configuration from the specified path.
    this.config = Config.fromFile(configPath);
    this.jobRegistry = new JobRegistry();
    this.workersRegistry = new WorkersRegistry({
      jobRegistry: this.jobRegistry,
      ...this.config.workersConfig,
      workers: this.#workers
    });

    this.workersRegistry.initWorkers();
  }
}

export { Application };