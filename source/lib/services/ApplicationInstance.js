import { Engine, JobFactory, JobRegistry, WorkerFactory, WorkersRegistry } from 'deku-swarm';
import { ConfigIncluder } from './ConfigIncluder.js';
import { EngineEvents } from './EngineEvents.js';
import { FailureChecker } from './FailureChecker.js';
import { RunSummary } from './RunSummary.js';
import { ConfigurationFileNotProvided } from '../exceptions/config/ConfigurationFileNotProvided.js';
import { ActionProcessingJob } from '../jobs/ActionProcessingJob.js';
import { AssetDownloadJob } from '../jobs/AssetDownloadJob.js';
import { ExtractionJob } from '../jobs/ExtractionJob.js';
import { HtmlParseJob } from '../jobs/HtmlParseJob.js';
import { PaginatedActionProcessingJob } from '../jobs/PaginatedActionProcessingJob.js';
import { ResourceRequestJob } from '../jobs/ResourceRequestJob.js';
import { Config } from '../models/configs/Config.js';
import { RegexParser } from '../parsers/RegexParser.js';
import { LogRegistry } from '../registry/LogRegistry.js';
import { NamespaceMap } from '../registry/NamespaceMap.js';
import { ParserRegistry } from '../registry/ParserRegistry.js';
import { WebServer } from '../server/WebServer.js';
import { LogContext } from '../utils/logging/LogContext.js';
import { PromiseAggregator } from '../utils/PromiseAggregator.js';
import { ResourceEnqueuer } from '../utils/ResourceEnqueuer.js';

const DEFAULT_POLL_SLEEP_MS = 10;

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
  #configPath;

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

    this.#configPath = configPath;
    this.config = Config.fromFile(configPath);
    const logRegistry = LogRegistry.build({ retention: this.config.logConfig.size });
    this.#bufferedLogger = logRegistry.bufferedLogger;
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

    if (this.#shouldAutostart()) {
      this.enqueueFirstJobs();
      this.#engineStatus = 'running';
    } else {
      this.engine.pause();
      this.#engineStatus = 'stopped';
    }

    this.#aggregator.add(this.webServer?.start());
    this.#enginePromise = this.engine.start();
    this.#aggregator.add(this.#enginePromise);

    await this.#aggregator.wait();
    this.#finishRun();
  }

  /**
   * Builds and returns a new Engine instance wired to the current registries.
   * @returns {Engine} The created Engine instance.
   */
  buildEngine() {
    return new Engine({
      jobRegistry: JobRegistry,
      workersRegistry: WorkersRegistry,
      sleepMs: this.#sleepMs ?? this.config.workersConfig.sleep,
      keepAlive: !!this.config.webConfig,
      idleTimeoutMs: (this.config.webConfig?.idleTimeout ?? 0) * 1000,
      onIdleTimeout: () => this.#handleIdleTimeout(),
    });
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
   * Delegates to `ResourceEnqueuer#enqueueAll` (default namespace), so it always
   * reflects the live state of the `NamespaceMap` singleton, including resources
   * added via `POST /api/config` after boot.
   * @returns {void}
   */
  enqueueFirstJobs() {
    new ResourceEnqueuer().enqueueAll();
  }

  /**
   * Enqueues resources by name, or all parameter-free resources when no names are given.
   * Unknown resource names, or resources with any request that needs parameters, are
   * skipped entirely and reported back rather than failing the whole call.
   * @param {Array<string>} [names=[]] - Resource names to enqueue; omit/empty for the default set.
   * @returns {{enqueued: Array<string>, skippedResources: Array<{name: string, reason: string}>}} The enqueued names and any skipped resources.
   */
  enqueueResources(names = []) {
    if (!names.length) {
      this.enqueueFirstJobs();
      return { enqueued: [], skippedResources: [] };
    }

    return new ResourceEnqueuer().enqueue(names);
  }

  /**
   * Returns the current engine status string.
   * @returns {string|undefined} The current status.
   */
  status() {
    return this.#engineStatus;
  }

  /**
   * Returns true if the engine is currently running.
   * @returns {boolean} True if the current status is 'running'.
   */
  isRunning() {
    return this.#engineStatus === 'running';
  }

  /**
   * Returns true if the engine is currently paused.
   * @returns {boolean} True if the current status is 'paused'.
   */
  isPaused() {
    return this.#engineStatus === 'paused';
  }

  /**
   * Returns true if the engine is currently stopped.
   * @returns {boolean} True if the current status is 'stopped'.
   */
  isStopped() {
    return this.#engineStatus === 'stopped';
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
   * Pauses processing: pauses the engine (without stopping it) and waits for workers to become idle.
   * @returns {Promise<void>}
   */
  async pause() {
    this.#engineStatus = 'pausing';
    this.engine.pause();
    await this.#waitForWorkersIdle();
    this.#engineStatus = 'paused';
  }

  /**
   * Stops processing: pauses the engine, waits for workers to idle, then clears job queues.
   * The engine instance is preserved and its loop continues running in the background.
   * @returns {Promise<void>}
   */
  async stop() {
    this.#engineStatus = 'stopping';
    this.engine.pause();
    await this.#waitForWorkersIdle();
    JobRegistry.clearQueues();
    this.#engineStatus = 'stopped';
    EngineEvents.emit('stop');
  }

  /**
   * Resumes processing after a pause by calling engine.resume().
   * No new engine is created; the existing loop continues.
   * Only valid when status is 'paused'.
   * @returns {Promise<void>}
   */
  async continue() {
    if (this.#engineStatus !== 'paused') return;
    this.engine.resume();
    this.#engineStatus = 'running';
  }

  /**
   * Starts processing from a stopped state by calling engine.resume() and enqueueing resources.
   * No new engine is created; the existing loop continues.
   * Only valid when status is 'stopped'.
   * @param {Array<string>} [names=[]] - Resource names to enqueue; omit/empty for the default set.
   * @param {object} [options={}] - Extra options.
   * @param {boolean} [options.enqueue=true] - When false, only transitions the engine to
   * `running` without enqueueing anything — used by callers (namespace-scoped `/api`
   * flows) that manage their own enqueueing afterwards.
   * @returns {Promise<{enqueued: Array<string>, skippedResources: Array<object>}|undefined>} The enqueue result, or undefined when not stopped.
   */
  async start(names = [], { enqueue = true } = {}) {
    if (this.#engineStatus !== 'stopped') return undefined;
    this.engine.resume();
    this.#engineStatus = 'running';
    EngineEvents.emit('start');
    if (!enqueue) return { enqueued: [], skippedResources: [] };
    return this.enqueueResources(names);
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
   * Reloads processing: stops the engine, re-reads the on-disk config file(s) and
   * merges them into the live `NamespaceMap`, then starts the engine again.
   * Only valid when status is 'running'.
   * @returns {Promise<void>}
   */
  async reload() {
    if (this.#engineStatus !== 'running') return;
    await this.stop();
    NamespaceMap.include(ConfigIncluder.resolve(this.#configPath));
    await this.start();
  }

  /**
   * Shuts down the web server and stops the engine loop.
   * If running, pauses first and waits for workers to idle.
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.webServer?.shutdown();
    if (this.#engineStatus === 'running') {
      await this.stop();
    }
    this.engine.stop();
  }

  /**
   * Determines whether the engine should start processing immediately at boot.
   * Defaults to true when there is no web configuration or no explicit setting.
   * @returns {boolean} True if the engine should auto-start.
   */
  #shouldAutostart() {
    return this.config.webConfig?.autostart ?? true;
  }

  /**
   * Invoked by the Engine when `web.idle_timeout` has elapsed with no jobs
   * queued and no busy workers. Shuts the application down exactly like a
   * manual `PATCH /engine/shutdown` call, regardless of `enable_shutdown`.
   * @returns {Promise<void>}
   */
  async #handleIdleTimeout() {
    await this.shutdown();
  }

  /**
   * Polls until all workers are idle.
   * @returns {Promise<void>}
   */
  async #waitForWorkersIdle() {
    while (WorkersRegistry.hasBusyWorker()) {
      await new Promise(resolve => setTimeout(resolve, this.#sleepMs ?? DEFAULT_POLL_SLEEP_MS));
    }
  }

  /**
   * Initializes the job factory, job registry, and workers registry from the loaded configuration.
   * @returns {void}
   */
  #initRegistries() {
    JobFactory.build('ResourceRequestJob', { klass: ResourceRequestJob, attributes: { clients: this.config.namespaceMap } });
    JobFactory.build('Action', { klass: ActionProcessingJob });
    JobFactory.build('PaginatedAction', { klass: PaginatedActionProcessingJob });
    JobFactory.build('HtmlParse', { klass: HtmlParseJob, attributes: { jobRegistry: JobRegistry, clientRegistry: this.config.namespaceMap } });
    JobFactory.build('AssetDownload', { klass: AssetDownloadJob, attributes: { clientRegistry: this.config.namespaceMap } });

    const parserRegistry = new ParserRegistry({ regex: new RegexParser() });
    JobFactory.build('Extraction', { klass: ExtractionJob, attributes: { parserRegistry } });

    JobRegistry.build({ cooldown: this.config.workersConfig.retryCooldown, maxRetries: this.config.workersConfig.maxRetries });

    const loggerFactory = ({ workerId, jobId }) => new LogContext({ workerId, jobId });

    WorkersRegistry.build({
      workers: this.#workers,
      factory: new WorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, loggerFactory }),
      ...this.config.workersConfig,
    });
    WorkersRegistry.initWorkers();
  }

  /**
   * Finalizes the run lifecycle by emitting stop events and evaluating failures.
   * @returns {void}
   */
  #finishRun() {
    this.#engineStatus = 'stopped';
    EngineEvents.emit('stop');
    this.#printRunSummary();
    new FailureChecker({ failureConfig: this.config.failureConfig }).check();
  }

  /**
   * Prints the final run summary before threshold checking.
   * @returns {void}
   */
  #printRunSummary() {
    const stats = JobRegistry.stats();
    const summary = new RunSummary({
      totalJobs: stats.total,
      failedJobs: stats.failed + stats.retryQueue + stats.dead,
      threshold: this.config.failureConfig?.threshold,
    });

    LogRegistry.info(summary.report());
  }
}

export { ApplicationInstance };
