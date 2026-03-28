import { Engine } from './Engine.js';
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
  loadConfig(configPath, ...options) {
    if (!configPath) {
      throw new ConfigurationFileNotProvided();
    }

    // Load the configuration from the specified path.
    this.config = Config.fromFile(configPath);
    this.#initRegistries(...options);
  }

  #initRegistries({ jobRegistry, workersRegistry } = {}) {
    this.jobRegistry = jobRegistry || new JobRegistry({ clients: this.config.clients });
    this.workersRegistry = workersRegistry || new WorkersRegistry({
      jobRegistry: this.jobRegistry,
      workers: this.#workers,
      ...this.config.workersConfig
    });

    this.workersRegistry.initWorkers();
  }

  run() {
    this.engine = this.buildEngine();
    this.enqueueFirstJobs();
    //this.engine.start();
  }

  buildEngine() {
    return new Engine({
      jobRegistry: this.jobRegistry,
      workersRegistry: this.workersRegistry
    });
  }

  enqueueFirstJobs() {
    this.config.resourceRegistry.filter(resource => true).forEach(resource => {
      resource.resourceRequests.forEach(resourceRequest => {
        const parameters = {};
        this.jobRegistry.enqueue({ resourceRequest, parameters });
      });
    });
  }
}

export { Application };