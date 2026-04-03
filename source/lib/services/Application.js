import { Engine } from './Engine.js';
import { ConfigurationFileNotProvided } from '../exceptions/ConfigurationFileNotProvided.js';
import { Config } from '../models/Config.js';
import { JobRegistry } from '../registry/JobRegistry.js';
import { WorkersRegistry } from '../registry/WorkersRegistry.js';
import { WebServer } from '../server/WebServer.js';
import { ResourceRequestCollector } from '../utils/ResourceRequestCollector.js';

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

  /**
   * Starts the application by building the engine, web server, enqueueing initial jobs, and starting both.
   * @returns {void}
   */
  run() {
    this.engine = this.buildEngine();
    this.webServer = this.buildWebServer();
    this.enqueueFirstJobs();
    this.webServer?.start();
    this.engine.start();
  }

  /**
   * Builds and returns a new Engine instance wired to the current registries.
   * @returns {Engine} The created Engine instance.
   */
  buildEngine() {
    return new Engine({
      jobRegistry: this.jobRegistry,
      workersRegistry: this.workersRegistry
    });
  }

  /**
   * Builds and returns a WebServer if web configuration is present, otherwise null.
   * @returns {WebServer|null} The created WebServer instance or null.
   */
  buildWebServer() {
    return WebServer.build({
      webConfig:       this.config.webConfig,
      jobRegistry:     this.jobRegistry,
      workersRegistry: this.workersRegistry,
    });
  }

  /**
   * Enqueues all parameter-free ResourceRequests into the job registry.
   * These are requests whose URLs contain no {:placeholder} tokens and can be
   * processed immediately without any external parameters.
   * @returns {void}
   */
  enqueueFirstJobs() {
    new ResourceRequestCollector(this.config.resourceRegistry).requestsNeedingNoParams().forEach((resourceRequest) => {
      this.jobRegistry.enqueue({ resourceRequest, parameters: {} });
    });
  }
}

export { Application };