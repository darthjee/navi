import { WorkersAllocator } from './WorkersAllocator.js';
import { JobRegistry } from '../background/JobRegistry.js';
import { WorkersRegistry } from '../background/WorkersRegistry.js';
import { Logger } from '../utils/logging/Logger.js';

/**
 * Engine is responsible for managing the job processing workflow.
 *
 * It continuously checks for available jobs and idle workers, and assigns
 * jobs to workers until there are no more jobs and no more busy workers.
 * In keepAlive mode (web UI present), the loop continues indefinitely until
 * `stop()` is explicitly called.
 */
class Engine {
  #sleepMs;
  #stopped = false;
  #paused = false;
  #keepAlive;

  /**
   * Creates an instance of Engine.
   * @param {object} param0 - The parameters for creating an Engine instance.
   * @param {WorkersAllocator} param0.allocator - The workers allocator to manage job allocation.
   * @param {number} [param0.sleepMs=500] - Milliseconds to wait when all jobs are in cooldown. Use a negative value to disable sleeping (e.g. in tests).
   * @param {boolean} [param0.keepAlive=false] - When true, the loop runs indefinitely until `stop()` is called (web UI mode).
   */
  constructor({ allocator, sleepMs = 500, keepAlive = false } = {}) {
    this.#sleepMs = sleepMs;
    this.#keepAlive = keepAlive;

    this.allocator = allocator || new WorkersAllocator();
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
      Logger.debug('Promoting ready jobs and allocating to idle workers if available...');
      JobRegistry.promoteReadyJobs();

      if (!this.#paused && JobRegistry.hasReadyJob()) {
        this.allocator.allocate();
      }

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
    return JobRegistry.hasJob() || WorkersRegistry.hasBusyWorker();
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
