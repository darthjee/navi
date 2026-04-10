import { WorkersAllocator } from './WorkersAllocator.js';
import { JobRegistry } from '../registry/JobRegistry.js';
import { WorkersRegistry } from '../registry/WorkersRegistry.js';

/**
 * Engine is responsible for managing the job processing workflow.
 *
 * It continuously checks for available jobs and idle workers, and assigns
 * jobs to workers until there are no more jobs and no more busy workers.
 */
class Engine {
  #sleepMs;

  /**
   * Creates an instance of Engine.
   * @param {object} param0 - The parameters for creating an Engine instance.
   * @param {WorkersAllocator} param0.allocator - The workers allocator to manage job allocation.
   * @param {number} [param0.sleepMs=500] - Milliseconds to wait when all jobs are in cooldown. Use a negative value to disable sleeping (e.g. in tests).
   */
  constructor({ allocator, sleepMs = 500 } = {}) {
    this.#sleepMs = sleepMs;

    this.allocator = allocator || new WorkersAllocator();
  }

  /**
   * Starts the engine by processing jobs.
   *
   * This method continuously checks for available jobs and idle workers, and assigns
   * jobs to workers until there are no more jobs and no more busy workers.
   * @returns {Promise<void>}
   */
  async start() {
    while (this.#continueAllocating()) {
      JobRegistry.promoteReadyJobs();

      if (JobRegistry.hasReadyJob()) {
        this.allocator.allocate();
      } else {
        await this.#sleep(this.#sleepMs);
      }
    }
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
   * @param {number} ms - Duration in milliseconds to sleep.
   * @returns {Promise<void>}
   */
  #sleep(ms) {
    if (ms < 0) return Promise.resolve();
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export { Engine };
