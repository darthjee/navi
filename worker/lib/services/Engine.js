import { EventEmitter } from 'events';
import { WorkersAllocator } from './WorkersAllocator.js';
import { JobRegistry } from '../background/JobRegistry.js';
import { WorkersRegistry } from '../background/WorkersRegistry.js';

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
  #emitter = new EventEmitter();

  /**
   * Creates an instance of Engine.
   * @param {object} param0 - The parameters for creating an Engine instance.
   * @param {WorkersAllocator} [param0.allocator] - The workers allocator to manage job allocation. Defaults to a new `WorkersAllocator` built from `jobRegistry`/`workersRegistry`.
   * @param {JobRegistry} [param0.jobRegistry=JobRegistry] - Defaults to the JobRegistry singleton facade. Pass an instance for explicit DI.
   * @param {WorkersRegistry} [param0.workersRegistry=WorkersRegistry] - Defaults to the WorkersRegistry singleton facade. Pass an instance for explicit DI.
   * @param {number} [param0.sleepMs=500] - Milliseconds to wait when all jobs are in cooldown. Use a negative value to disable sleeping (e.g. in tests).
   * @param {boolean} [param0.keepAlive=false] - When true, the loop runs indefinitely until `stop()` is called (web UI mode).
   * @param {number} [param0.idleTimeoutMs=0] - Milliseconds of inactivity before `onIdleTimeout` fires. `0` disables idle-timeout tracking.
   * @param {Function} [param0.onIdleTimeout] - Callback invoked (without being awaited) once the idle threshold is reached. Fires at most once per idle window.
   */
  constructor({ allocator, jobRegistry = JobRegistry, workersRegistry = WorkersRegistry, sleepMs = 500, keepAlive = false, idleTimeoutMs = 0, onIdleTimeout = () => {} } = {}) {
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
   * Registers a handler for a domain-agnostic named event.
   * Event names are opaque strings — Engine has no built-in notion of what
   * events exist; callers define and emit their own. Multiple handlers
   * registered for the same event name fire in registration order.
   * @param {string} eventName - The name of the event to listen for.
   * @param {Function} handler - The callback invoked when the event fires.
   * @returns {void}
   */
  on(eventName, handler) {
    this.#emitter.on(eventName, handler);
  }

  /**
   * Emits a domain-agnostic named event, invoking all handlers registered
   * via `on()` for that event name, in registration order. A no-op when
   * there are no listeners for the given event name.
   * @param {string} eventName - The name of the event to emit.
   * @param {...*} args - Arguments forwarded to each registered handler.
   * @returns {void}
   */
  emit(eventName, ...args) {
    this.#emitter.emit(eventName, ...args);
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
