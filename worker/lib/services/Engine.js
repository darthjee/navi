import { WorkersAllocator } from './WorkersAllocator.js';

/**
 * Engine is responsible for managing the job processing workflow.
 *
 * It continuously checks for available jobs and idle workers, and assigns
 * jobs to workers until there are no more jobs and no more busy workers.
 * In keepAlive mode (web UI present), the loop continues indefinitely until
 * `stop()` is explicitly called.
 *
 * When `idleTimeoutMs` is set, the loop also tracks how long it has been idle
 * (no jobs queued and no busy workers) and invokes `onIdleTimeout` once that
 * threshold is crossed; the idle window resets as soon as activity resumes.
 */
class Engine {
  #sleepMs;
  #stopped = false;
  #paused = false;
  #keepAlive;
  #idleTimeoutMs;
  #onIdleTimeout;
  #idleSince = null;
  #idleTimeoutFired = false;
  #jobRegistry;
  #workersRegistry;

  /**
   * Creates an instance of Engine.
   * @param {object} param0 - The parameters for creating an Engine instance.
   * @param {WorkersAllocator} [param0.allocator] - The workers allocator to manage job allocation. Defaults to a new `WorkersAllocator` built from `jobRegistry`/`workersRegistry`.
   * @param {JobRegistry} param0.jobRegistry - The job registry to check and promote jobs on.
   * @param {WorkersRegistry} param0.workersRegistry - The workers registry to check busy workers on.
   * @param {number} [param0.sleepMs=500] - Milliseconds to wait when all jobs are in cooldown. Use a negative value to disable sleeping (e.g. in tests).
   * @param {boolean} [param0.keepAlive=false] - When true, the loop runs indefinitely until `stop()` is called (web UI mode).
   * @param {number} [param0.idleTimeoutMs=0] - Milliseconds of inactivity before `onIdleTimeout` fires. `0` disables idle-timeout tracking.
   * @param {Function} [param0.onIdleTimeout] - Callback invoked (without being awaited) once the idle threshold is reached. Fires at most once per idle window.
   */
  constructor({ allocator, jobRegistry, workersRegistry, sleepMs = 500, keepAlive = false, idleTimeoutMs = 0, onIdleTimeout = () => {} } = {}) {
    this.#sleepMs = sleepMs;
    this.#keepAlive = keepAlive;
    this.#idleTimeoutMs = idleTimeoutMs;
    this.#onIdleTimeout = onIdleTimeout;
    this.#jobRegistry = jobRegistry;
    this.#workersRegistry = workersRegistry;

    this.allocator = allocator || new WorkersAllocator({ jobRegistry, workersRegistry });
  }

  /**
   * Stops the engine by setting the stop flag.
   * The current iteration will complete before the loop exits.
   * @returns {void}
   */
  stop() {
    this.#stopped = true;
  }

  /**
   * Pauses allocation without exiting the loop.
   * While paused, the engine keeps iterating but skips job allocation.
   * @returns {void}
   */
  pause() {
    this.#paused = true;
  }

  /**
   * Resumes allocation after a pause.
   * @returns {void}
   */
  resume() {
    this.#paused = false;
  }

  /**
   * Starts the engine by processing jobs.
   *
   * This method continuously checks for available jobs and idle workers, and assigns
   * jobs to workers until there are no more jobs and no more busy workers,
   * or until `stop()` has been called. In keepAlive mode, the loop continues even
   * when the queue is empty, waiting for new work.
   * @returns {Promise<void>}
   */
  async start() {
    while (!this.#stopped && this.#shouldContinue()) {
      this.#jobRegistry.promoteReadyJobs();

      if (!this.#paused && this.#jobRegistry.hasReadyJob()) {
        this.allocator.allocate();
      }

      this.#checkIdleTimeout();

      // wait before next iteration so the block runs ~once per second
      await this.#sleep();
    }
  }

  /**
   * Determines whether the engine loop should continue.
   * In keepAlive mode, always returns true. Otherwise, returns true only
   * while there are jobs or busy workers.
   * @returns {boolean} True if the loop should continue.
   */
  #shouldContinue() {
    return this.#keepAlive || this.#continueAllocating();
  }

  /**
   * Checks if the engine should continue allocating jobs to workers.
   * @returns {boolean} True if there are jobs to process or busy workers, false otherwise.
   */
  #continueAllocating() {
    return this.#jobRegistry.hasJob() || this.#workersRegistry.hasBusyWorker();
  }

  /**
   * Tracks idle time (no queued jobs, no busy workers) across loop ticks and
   * fires `onIdleTimeout` once at most per idle window when `idleTimeoutMs`
   * is exceeded. Any activity resets the window. No-op when idle-timeout
   * tracking is disabled (`idleTimeoutMs <= 0`).
   * @returns {void}
   */
  #checkIdleTimeout() {
    if (this.#idleTimeoutMs <= 0) return;

    if (this.#continueAllocating()) {
      this.#idleSince = null;
      this.#idleTimeoutFired = false;
      return;
    }

    if (this.#idleSince === null) {
      this.#idleSince = Date.now();
      return;
    }

    if (!this.#idleTimeoutFired && Date.now() - this.#idleSince >= this.#idleTimeoutMs) {
      this.#idleTimeoutFired = true;
      this.#onIdleTimeout();
    }
  }

  /**
   * Waits for the given number of milliseconds.
   * @returns {Promise<void>}
   */
  #sleep() {
    const ms = this.#sleepMs;
    if (ms < 0) return Promise.resolve();
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export { Engine };
