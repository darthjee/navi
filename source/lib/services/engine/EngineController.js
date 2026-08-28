import { JobRegistry, WorkersRegistry } from 'deku-swarm';
import { EngineEvents } from './EngineEvents.js';
import { RunReporter } from '../execution/RunReporter.js';

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
  #reporter;
  #reloadConfig;
  #enqueueResources;

  engine;
  webServer;

  /**
   * @param {object} [params={}] - Dependency injection parameters.
   * @param {EngineState} [params.state] - Shared engine status state machine.
   * @param {Config} [params.config] - The application's loaded configuration.
   * @param {number} [params.sleepMs] - Poll interval in ms for idle-wait.
   * @param {RunReporter} [params.reporter] - Run summary/failure-check collaborator (injected for testing).
   * @param {Function} [params.reloadConfig] - Callback invoked by `reload()` to re-read config.
   * @param {Function} [params.enqueueResources] - Callback invoked by `start()` to enqueue resources by name.
   */
  constructor({ state, config, sleepMs, reporter, reloadConfig, enqueueResources } = {}) {
    this.#state = state;
    this.config = config;
    this.#sleepMs = sleepMs;
    this.#reporter = reporter ?? new RunReporter();
    this.#reloadConfig = reloadConfig;
    this.#enqueueResources = enqueueResources;
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
    EngineEvents.emit('stop');
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
    if (!this.#state.isStopped()) return undefined;
    this.engine.resume();
    this.#state.set('running');
    EngineEvents.emit('start');
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
    await this.start();
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
    await this.start();
  }

  /**
   * Shuts down the web server and stops the engine loop.
   * If running, pauses first and waits for workers to idle.
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.webServer?.shutdown();
    if (this.#state.isRunning()) {
      await this.stop();
    }
    this.engine.stop();
  }

  /**
   * Finalizes the run lifecycle by emitting stop events and reporting the run outcome.
   * @returns {void}
   */
  finishRun() {
    this.#state.set('stopped');
    EngineEvents.emit('stop');
    this.#reporter.report({ failureConfig: this.config.failureConfig });
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
