import { Engine, JobRegistry, WorkersRegistry } from 'deku-swarm';
import { ApplicationConfigurator } from './ApplicationConfigurator.js';
import { ResourceQueueFacade } from './ResourceQueueFacade.js';
import { NamespaceMap } from '../../registry/NamespaceMap.js';
import { WebServer } from '../../server/WebServer.js';
import { PromiseAggregator } from '../../utils/PromiseAggregator.js';
import { RegistriesBuilder } from '../builders/RegistriesBuilder.js';
import { ConfigIncluder } from '../config/ConfigIncluder.js';
import { EngineController } from '../engine/EngineController.js';
import { EngineState } from '../engine/EngineState.js';
import { RunReporter } from '../execution/RunReporter.js';

/**
 * ApplicationInstance holds all instance-level state and logic for a single
 * application lifecycle. Use the static `Application` facade to access it.
 * @author darthjee
 */
class ApplicationInstance {
  #workers;
  #bufferedLogger;
  #state;
  #registriesBuilder;
  #configurator;
  #reporter;
  #aggregator;
  #enginePromise;
  #sleepMs;
  #configPath;
  #engineController;
  #resourceQueueFacade;

  /**
   * @param {object} [params={}] - Optional parameters for dependency injection.
   * @param {IdentifyableCollection} [params.workers] - Workers collection (injected for testing).
   * @param {EngineState} [params.state] - Engine status state machine (injected for testing).
   * @param {RegistriesBuilder} [params.registriesBuilder] - Registries bootstrap collaborator (injected for testing).
   * @param {ApplicationConfigurator} [params.configurator] - Config loading collaborator (injected for testing).
   * @param {RunReporter} [params.reporter] - Run summary/failure-check collaborator (injected for testing).
   * @param {ResourceQueueFacade} [params.resourceQueueFacade] - Resource-enqueuing collaborator (injected for testing).
   */
  constructor({ workers, state, registriesBuilder, configurator, reporter, resourceQueueFacade } = {}) {
    this.#workers = workers;
    this.#state = state ?? new EngineState();
    this.#registriesBuilder = registriesBuilder ?? new RegistriesBuilder();
    this.#configurator = configurator ?? new ApplicationConfigurator();
    this.#reporter = reporter ?? new RunReporter();
    this.#resourceQueueFacade = resourceQueueFacade ?? new ResourceQueueFacade();
  }

  /**
   * Loads the configuration from the specified file path.
   * @param {string} configPath - The path to the configuration file.
   * @throws {ConfigurationFileNotProvided} If the configuration file path is not provided.
   * @throws {ConfigurationFileNotFound} If the configuration file is not found at the specified path.
   * @returns {void}
   */
  loadConfig(configPath) {
    this.#configPath = configPath;
    const { config, bufferedLogger } = this.#configurator.load(configPath);
    this.config = config;
    this.#bufferedLogger = bufferedLogger;
    this.#registriesBuilder.build({ config, workers: this.#workers });
  }

  /**
   * Starts the application by building the engine, web server, enqueueing initial jobs, and starting both.
   * After the engine finishes, checks the dead-job ratio against the configured failure threshold.
   * @returns {Promise<void>}
   */
  async run() {
    this.#aggregator = new PromiseAggregator();
    this.#sleepMs = this.config.workersConfig.sleep;

    this.#engineController = new EngineController({
      state: this.#state,
      config: this.config,
      sleepMs: this.#sleepMs,
      reporter: this.#reporter,
      reloadConfig: () => NamespaceMap.include(ConfigIncluder.resolve(this.#configPath)),
      enqueueResources: names => this.enqueueResources(names),
    });

    this.engine = this.buildEngine();
    this.webServer = this.buildWebServer();
    this.#engineController.engine = this.engine;
    this.#engineController.webServer = this.webServer;

    if (this.#shouldAutostart()) {
      this.enqueueFirstJobs();
      this.#state.set('running');
    } else {
      this.engine.pause();
      this.#state.set('stopped');
    }

    this.#aggregator.add(this.webServer?.start());
    this.#enginePromise = this.engine.start();
    this.#aggregator.add(this.#enginePromise);

    await this.#aggregator.wait();
    this.#engineController.finishRun();
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
      onIdleTimeout: () => this.shutdown(),
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
   * Delegates to `ResourceQueueFacade#enqueueFirstJobs`.
   * @returns {void}
   */
  enqueueFirstJobs() {
    this.#resourceQueueFacade.enqueueFirstJobs();
  }

  /**
   * Enqueues resources by name, or all parameter-free resources when no names are given.
   * Delegates to `ResourceQueueFacade#enqueueResources`.
   * @param {Array<string>} [names=[]] - Resource names to enqueue; omit/empty for the default set.
   * @returns {{enqueued: Array<string>, skippedResources: Array<{name: string, reason: string}>}} The enqueued names and any skipped resources.
   */
  enqueueResources(names = []) {
    return this.#resourceQueueFacade.enqueueResources(names);
  }

  /**
   * Returns the current engine status string.
   * @returns {string|undefined} The current status.
   */
  status() {
    return this.#state.get();
  }

  /**
   * Returns true if the engine is currently running.
   * @returns {boolean} True if the current status is 'running'.
   */
  isRunning() {
    return this.#state.isRunning();
  }

  /**
   * Returns true if the engine is currently paused.
   * @returns {boolean} True if the current status is 'paused'.
   */
  isPaused() {
    return this.#state.isPaused();
  }

  /**
   * Returns true if the engine is currently stopped.
   * @returns {boolean} True if the current status is 'stopped'.
   */
  isStopped() {
    return this.#state.isStopped();
  }

  /**
   * Sets the engine status string.
   * @param {string} value - The new status value.
   * @returns {void}
   */
  setStatus(value) {
    this.#state.set(value);
  }

  /**
   * Pauses processing: pauses the engine (without stopping it) and waits for workers to become idle.
   * @returns {Promise<void>}
   */
  async pause() {
    return this.#engineController.pause();
  }

  /**
   * Stops processing: pauses the engine, waits for workers to idle, then clears job queues.
   * The engine instance is preserved and its loop continues running in the background.
   * @returns {Promise<void>}
   */
  async stop() {
    return this.#engineController.stop();
  }

  /**
   * Resumes processing after a pause by calling engine.resume().
   * No new engine is created; the existing loop continues.
   * Only valid when status is 'paused'.
   * @returns {Promise<void>}
   */
  async continue() {
    return this.#engineController.continue();
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
  async start(names = [], options = {}) {
    return this.#engineController.start(names, options);
  }

  /**
   * Restarts processing: stops then starts the engine.
   * Only valid when status is 'running'.
   * @returns {Promise<void>}
   */
  async restart() {
    return this.#engineController.restart();
  }

  /**
   * Reloads processing: stops the engine, re-reads the on-disk config file(s) and
   * merges them into the live `NamespaceMap`, then starts the engine again.
   * Only valid when status is 'running'.
   * @returns {Promise<void>}
   */
  async reload() {
    return this.#engineController.reload();
  }

  /**
   * Shuts down the web server and stops the engine loop.
   * If running, pauses first and waits for workers to idle.
   * @returns {Promise<void>}
   */
  async shutdown() {
    return this.#engineController.shutdown();
  }

  /**
   * Determines whether the engine should start processing immediately at boot.
   * Defaults to true when there is no web configuration or no explicit setting.
   * @returns {boolean} True if the engine should auto-start.
   */
  #shouldAutostart() {
    return this.config.webConfig?.autostart ?? true;
  }
}

export { ApplicationInstance };
