import { Engine } from './Engine.js';
import { FailureChecker } from './FailureChecker.js';
import { ConfigurationFileNotProvided } from '../exceptions/ConfigurationFileNotProvided.js';
import { JobFactory } from '../factories/JobFactory.js';
import { ActionProcessingJob } from '../models/ActionProcessingJob.js';
import { AssetDownloadJob } from '../models/AssetDownloadJob.js';
import { Config } from '../models/Config.js';
import { HtmlParseJob } from '../models/HtmlParseJob.js';
import { JobRegistry } from '../registry/JobRegistry.js';
import { WorkersRegistry } from '../registry/WorkersRegistry.js';
import { WebServer } from '../server/WebServer.js';
import { BufferedLogger } from '../utils/logging/BufferedLogger.js';
import { Logger } from '../utils/logging/Logger.js';
import { PromiseAggregator } from '../utils/PromiseAggregator.js';
import { ResourceRequestCollector } from '../utils/ResourceRequestCollector.js';

/**
 * ApplicationInstance holds all instance-level state and logic for a single
 * application lifecycle. Use the static `Application` facade to access it.
 * @author darthjee
 */
class ApplicationInstance {
  #workers;
  #bufferedLogger;
  #engineStatus;
  #aggregator;
  #enginePromise;
  #sleepMs;

  /**
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

    this.config = Config.fromFile(configPath);
    this.#bufferedLogger = new BufferedLogger(undefined, this.config.logConfig.size);
    Logger.addLogger(this.#bufferedLogger);
    this.#initRegistries();
  }

  /**
   * Starts the application by building the engine, web server, enqueueing initial jobs, and starting both.
   * After the engine finishes, checks the dead-job ratio against the configured failure threshold.
   * @returns {Promise<void>}
   */
  async run() {
    this.#aggregator = new PromiseAggregator();
    this.#sleepMs = this.config.workersConfig.sleep;

    this.engine = this.buildEngine();
    this.webServer = this.buildWebServer();
    this.enqueueFirstJobs();

    this.#engineStatus = 'running';
    this.#aggregator.add(this.webServer?.start());
    this.#enginePromise = this.engine.start();
    this.#aggregator.add(this.#enginePromise);

    await this.#aggregator.wait();
    this.#engineStatus = 'stopped';

    new FailureChecker({ failureConfig: this.config.failureConfig }).check();
  }

  /**
   * Builds and returns a new Engine instance wired to the current registries.
   * @returns {Engine} The created Engine instance.
   */
  buildEngine() {
    return new Engine({ sleepMs: this.#sleepMs ?? this.config.workersConfig.sleep });
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
   * Gets the buffered logger instance created during config loading.
   * @returns {BufferedLogger} The buffered logger instance.
   */
  get bufferedLogger() {
    return this.#bufferedLogger;
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
   * Returns the current engine status string.
   * @returns {string|undefined} The current status.
   */
  status() {
    return this.#engineStatus;
  }

  /**
   * Sets the engine status string.
   * @param {string} value - The new status value.
   * @returns {void}
   */
  setStatus(value) {
    this.#engineStatus = value;
  }

  /**
   * Pauses processing: stops the engine and waits for workers to become idle.
   * @returns {Promise<void>}
   */
  async pause() {
    this.#engineStatus = 'pausing';
    this.engine.stop();
    await this.#waitForWorkersIdle();
    this.#engineStatus = 'paused';
  }

  /**
   * Stops processing: stops the engine, waits for workers to idle, then clears job queues.
   * @returns {Promise<void>}
   */
  async stop() {
    this.#engineStatus = 'stopping';
    this.engine.stop();
    await this.#waitForWorkersIdle();
    JobRegistry.clearQueues();
    this.#engineStatus = 'stopped';
  }

  /**
   * Resumes processing after a pause by creating a new engine.
   * Only valid when status is 'paused'.
   * @returns {Promise<void>}
   */
  async continue() {
    if (this.#engineStatus !== 'paused') return;
    this.engine = this.buildEngine();
    this.#enginePromise = this.engine.start();
    this.#aggregator.add(this.#enginePromise);
    this.#engineStatus = 'running';
  }

  /**
   * Starts processing from a stopped state by creating a new engine and re-enqueueing initial jobs.
   * Only valid when status is 'stopped'.
   * @returns {Promise<void>}
   */
  async start() {
    if (this.#engineStatus !== 'stopped') return;
    this.engine = this.buildEngine();
    this.#enginePromise = this.engine.start();
    this.#aggregator.add(this.#enginePromise);
    this.enqueueFirstJobs();
    this.#engineStatus = 'running';
  }

  /**
   * Restarts processing: stops then starts the engine.
   * Only valid when status is 'running'.
   * @returns {Promise<void>}
   */
  async restart() {
    if (this.#engineStatus !== 'running') return;
    await this.stop();
    await this.start();
  }

  /**
   * Polls until all workers are idle.
   * @returns {Promise<void>}
   */
  async #waitForWorkersIdle() {
    while (WorkersRegistry.hasBusyWorker()) {
      await new Promise(resolve => setTimeout(resolve, this.#sleepMs ?? 10));
    }
  }

  /**
   * Initializes the job factory, job registry, and workers registry from the loaded configuration.
   * @returns {void}
   */
  #initRegistries() {
    JobFactory.build('ResourceRequestJob', { attributes: { clients: this.config.clientRegistry } });
    JobFactory.build('Action', { klass: ActionProcessingJob });
    JobFactory.build('HtmlParse', { klass: HtmlParseJob, attributes: { jobRegistry: JobRegistry, clientRegistry: this.config.clientRegistry } });
    JobFactory.build('AssetDownload', { klass: AssetDownloadJob, attributes: { clientRegistry: this.config.clientRegistry } });

    JobRegistry.build({ cooldown: this.config.workersConfig.retryCooldown, maxRetries: this.config.workersConfig.maxRetries });

    WorkersRegistry.build({
      workers: this.#workers,
      jobRegistry: JobRegistry,
      workersRegistry: WorkersRegistry,
      ...this.config.workersConfig,
    });
    WorkersRegistry.initWorkers();
  }
}

export { ApplicationInstance };
