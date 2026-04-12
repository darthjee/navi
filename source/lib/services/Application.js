import { Engine } from './Engine.js';
import { ConfigurationFileNotProvided } from '../exceptions/ConfigurationFileNotProvided.js';
import { JobFactory } from '../factories/JobFactory.js';
import { ActionProcessingJob } from '../models/ActionProcessingJob.js';
import { Config } from '../models/Config.js';
import { JobRegistry } from '../registry/JobRegistry.js';
import { WorkersRegistry } from '../registry/WorkersRegistry.js';
import { WebServer } from '../server/WebServer.js';
import { PromiseAggregator } from '../utils/PromiseAggregator.js';
import { ResourceRequestCollector } from '../utils/ResourceRequestCollector.js';

/**
 * Application orchestrates the startup of Navi by loading configuration,
 * building registries, and running the Engine loop together with the WebServer.
 * @author darthjee
 */
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
    this.#initRegistries();
  }

  /**
   * Starts the application by building the engine, web server, enqueueing initial jobs, and starting both.
   * @returns {Promise<void>}
   */
  async run() {
    const aggregator = new PromiseAggregator();

    this.engine = this.buildEngine();
    this.webServer = this.buildWebServer();
    this.enqueueFirstJobs();

    aggregator.add(this.webServer?.start());
    aggregator.add(this.engine.start());

    await aggregator.wait();
  }

  /**
   * Builds and returns a new Engine instance wired to the current registries.
   * @returns {Engine} The created Engine instance.
   */
  buildEngine() {
    return new Engine();
  }

  /**
   * Builds and returns a WebServer if web configuration is present, otherwise null.
   * @returns {WebServer|null} The created WebServer instance or null.
   */
  buildWebServer() {
    return WebServer.build({
      webConfig: this.config.webConfig,
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
      JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });
    });
  }

  /**
   * Initializes the job factory, job registry, and workers registry from the loaded configuration.
   * @returns {void}
   */
  #initRegistries() {
    JobFactory.build('ResourceRequestJob', { attributes: { clients: this.config.clientRegistry } });
    JobFactory.build('Action', { klass: ActionProcessingJob });

    JobRegistry.build({ cooldown: this.config.workersConfig.retryCooldown });

    WorkersRegistry.build({
      workers: this.#workers,
      ...this.config.workersConfig,
    });
    WorkersRegistry.initWorkers();
  }
}

export { Application };