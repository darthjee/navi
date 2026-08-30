import { Engine, JobRegistry, WorkersRegistry } from 'deku-swarm';
import { EmissionRegistry } from '../../registry/EmissionRegistry.js';
import { ExtractionRegistry } from '../../registry/ExtractionRegistry.js';
import { LogRegistry } from '../../registry/LogRegistry.js';
import { NamespaceMap } from '../../registry/NamespaceMap.js';
import { ConfigIncluder } from '../config/ConfigIncluder.js';

const DEFAULT_POLL_SLEEP_MS = 10;

/**
 * EngineController owns all engine processing-control/state-transition logic
 * (pause/stop/continue/start/restart/reload/shutdown, idle-wait polling, run
 * finalization) on behalf of `ApplicationInstance`, operating on a shared
 * `EngineState` instance injected at construction time.
 * @author darthjee
 */
class EngineController {
  #state;
  #sleepMs;
  #reloadConfig;
  #enqueueResources;
  #reporter;
  #shouldAutostart;

  engine;

  /**
   * The server controller wrapping the optional web server, wired in
   * externally by `ApplicationInstance` once both have been built.
   * @type {ServerController|undefined}
   */
  serverController;

  /**
   * @param {object} [params={}] - Dependency injection parameters.
   * @param {EngineState} [params.state] - Shared engine status state machine.
   * @param {Config} [params.config] - The application's loaded configuration.
   * @param {number} [params.sleepMs] - Poll interval in ms for idle-wait.
   * @param {Function} [params.reloadConfig] - Callback invoked by `reload()` to re-read config.
   * @param {Function} [params.enqueueResources] - Callback invoked by `resumeProcessing()` to enqueue resources by name.
   * @param {boolean} [params.shouldAutostart] - Whether `start()` should begin processing immediately.
   */
  constructor({ state, config, sleepMs, reloadConfig, enqueueResources, shouldAutostart } = {}) {
    this.#state = state;
    this.config = config;
    this.#sleepMs = sleepMs;
    this.#reloadConfig = reloadConfig;
    this.#enqueueResources = enqueueResources;
    this.#shouldAutostart = shouldAutostart;
  }

  /**
   * Builds a fully wired `EngineController`: constructs it, builds its `Engine`,
   * and binds the given reporter's `stop`/`finish` event listeners.
   * @param {object} params - Build parameters.
   * @param {EngineState} params.state - Shared engine status state machine.
   * @param {ConfigStore} params.configStore - Config-load output holder.
   * @param {number} params.sleepMs - Poll interval in ms for idle-wait.
   * @param {Function} params.enqueueResources - Callback invoked by `resumeProcessing()` to enqueue resources by name.
   * @param {RunReporter} params.reporter - Run summary/failure-check collaborator.
   * @param {boolean} params.shouldAutostart - Whether `start()` should begin processing immediately.
   * @returns {EngineController} The built and bound EngineController instance.
   */
  static build({ state, configStore, sleepMs, enqueueResources, reporter, shouldAutostart }) {
    const controller = new EngineController({
      state,
      config: configStore.config,
      sleepMs,
      reloadConfig: () => NamespaceMap.include(ConfigIncluder.resolve(configStore.entryFilePath)),
      enqueueResources,
      shouldAutostart,
    });

    controller.engine = controller.buildEngine();
    controller.bind(reporter);
    return controller;
  }

  /**
   * Builds and returns a new Engine instance wired to the current registries.
   * @returns {Engine} The created Engine instance.
   */
  buildEngine() {
    return new Engine({
      sleepMs: this.#sleepMs ?? this.config.workersConfig.sleep,
      keepAlive: !!this.config.webConfig,
      idleTimeoutMs: (this.config.webConfig?.idleTimeout ?? 0) * 1000,
      onIdleTimeout: () => this.shutdown(),
    });
  }

  /**
   * Stores the given reporter and wires the engine's `stop`/`finish` event listeners.
   * @param {RunReporter} reporter - Run summary/failure-check collaborator.
   * @returns {void}
   */
  bind(reporter) {
    this.#reporter = reporter;
    this.engine.on('stop', () => {
      LogRegistry.clearBuffers();
      EmissionRegistry.clear();
      ExtractionRegistry.clear();
    });
    this.engine.on('finish', () => this.#reporter.report({ failureConfig: this.config.failureConfig }));
  }

  /**
   * Kicks off the engine loop for the first time, either paused (with status set to
   * `stopped`) or running (with status set to `running`), depending on the
   * `shouldAutostart` flag stored at construction/build time.
   * @returns {Promise<void>} The engine's run-loop promise.
   */
  start() {
    if (!this.#shouldAutostart) {
      this.engine.pause();
      this.#state.set('stopped');
      return this.engine.start();
    }
    this.#state.set('running');
    return this.engine.start();
  }

  /**
   * Pauses processing: pauses the engine (without stopping it) and waits for workers to become idle.
   * @returns {Promise<void>}
   */
  async pause() {
    this.#state.set('pausing');
    this.engine.pause();
    await this.#waitForWorkersIdle();
    this.#state.set('paused');
  }

  /**
   * Stops processing: pauses the engine, waits for workers to idle, then clears job queues.
   * The engine instance is preserved and its loop continues running in the background.
   * @returns {Promise<void>}
   */
  async stop() {
    this.#state.set('stopping');
    this.engine.pause();
    await this.#waitForWorkersIdle();
    JobRegistry.clearQueues();
    this.#state.set('stopped');
    this.engine.emit('stop');
  }

  /**
   * Resumes processing after a pause by calling engine.resume().
   * No new engine is created; the existing loop continues.
   * Only valid when status is 'paused'.
   * @returns {Promise<void>}
   */
  async continue() {
    if (!this.#state.isPaused()) return;
    this.engine.resume();
    this.#state.set('running');
  }

  /**
   * Resumes processing from a stopped state by calling engine.resume() and enqueueing resources.
   * No new engine is created; the existing loop continues.
   * Only valid when status is 'stopped'.
   * @param {Array<string>} [names=[]] - Resource names to enqueue; omit/empty for the default set.
   * @param {object} [options={}] - Extra options.
   * @param {boolean} [options.enqueue=true] - When false, only transitions the engine to
   * `running` without enqueueing anything — used by callers (namespace-scoped `/api`
   * flows) that manage their own enqueueing afterwards.
   * @returns {Promise<{enqueued: Array<string>, skippedResources: Array<object>}|undefined>} The enqueue result, or undefined when not stopped.
   */
  async resumeProcessing(names = [], { enqueue = true } = {}) {
    if (!this.#state.isStopped()) return undefined;
    this.engine.resume();
    this.#state.set('running');
    this.engine.emit('start');
    if (!enqueue) return { enqueued: [], skippedResources: [] };
    return this.#enqueueResources(names);
  }

  /**
   * Restarts processing: stops then starts the engine.
   * Only valid when status is 'running'.
   * @returns {Promise<void>}
   */
  async restart() {
    if (!this.#state.isRunning()) return;
    await this.stop();
    await this.resumeProcessing();
  }

  /**
   * Reloads processing: stops the engine, re-reads the on-disk config file(s) and
   * merges them into the live `NamespaceMap`, then starts the engine again.
   * Only valid when status is 'running'.
   * @returns {Promise<void>}
   */
  async reload() {
    if (!this.#state.isRunning()) return;
    await this.stop();
    this.#reloadConfig();
    await this.resumeProcessing();
  }

  /**
   * Shuts down the web server and stops the engine loop.
   * If running, pauses first and waits for workers to idle.
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.serverController?.shutdown();
    if (this.#state.isRunning()) {
      await this.stop();
    }
    this.engine.stop();
  }

  /**
   * Finalizes the run lifecycle by emitting the 'stop' and 'finish' events.
   * Run-outcome reporting is handled by the 'finish' event's listener, not here.
   * @returns {void}
   */
  finishRun() {
    this.#state.set('stopped');
    this.engine.emit('stop');
    this.engine.emit('finish');
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
}

export { EngineController };
