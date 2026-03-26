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
   * @param {WorkersAllocator} param0.allocator - The workers allocator to manage job allocation.
   */
  constructor({ jobRegistry, workersRegistry, allocator }) {
    this.#jobRegistry = jobRegistry;
    this.#workersRegistry = workersRegistry;

    this.allocator = allocator || new WorkersAllocator({
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
    this.#allocateWorkers();
  }

  /**
   * Processes jobs by continuously allocating them to idle workers until there are no more jobs or no more idle workers.
   * @returns {void}
   * @private
   */
  #allocateWorkers() {
    while (this.#continueAllocating()) {
      this.allocator.allocate();
    }
  }

  /**
   * Checks if the engine should continue allocating jobs to workers.
   * @returns {boolean} True if there are jobs to process or busy workers, false otherwise.
   */
  #continueAllocating() {
    return this.#jobRegistry.hasJob() || this.#workersRegistry.hasBusyWorker();
  }
}

export { Engine };
