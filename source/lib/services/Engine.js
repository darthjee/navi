import { WorkersAllocator } from './WorkersAllocator.js';

/**
 * Engine is responsible for managing the job processing workflow.
 *
 * It continuously checks for available jobs and idle workers, and assigns
 * jobs to workers until there are no more jobs and no more busy workers.
 */
class Engine {
  #jobRegistry;
  #workersRegistry;

  /**
   * Creates an instance of Engine.
   * @param {object} param0 - The parameters for creating an Engine instance.
   * @param {JobRegistry} param0.jobRegistry - The job registry to allocate jobs from.
   * @param {WorkersRegistry} param0.workersRegistry - The workers registry to allocate workers from.
   */
  constructor({ jobRegistry, workersRegistry }) {
    this.#jobRegistry = jobRegistry;
    this.#workersRegistry = workersRegistry;

    this.allocator = new WorkersAllocator({
      jobRegistry: this.#jobRegistry,
      workersRegistry: this.#workersRegistry,
    });
  }

  /**
   * Starts the engine by processing jobs.
   * @returns {void}
   */
  start() {
    // Start the engine by processing jobs
    this.#processJobs();
  }

  /**
   * Processes jobs by continuously allocating them to idle workers until there are no more jobs or no more idle workers.
   * @returns {void}
   * @private
   */
  #processJobs() {
    // Main job processing loop

    while (this.#continueProcessing()) {
      this.allocator.allocate();
    }
  }

  /**
   * Checks if the engine should continue processing jobs.
   * @returns {boolean} True if there are jobs and idle workers, false otherwise.
   */
  #continueProcessing() {
    return this.#jobRegistry.hasJob()
    && this.#workersRegistry.hasIdleWorker();
  }
}

export { Engine };
