/**
 * WorkersAllocator is responsible for allocating jobs to idle workers.
 *
 * It continuously checks for available jobs and idle workers, and assigns
 * jobs to workers until there are no more jobs or no more idle workers.
 */
class WorkersAllocator {
  /**
   * Creates an instance of WorkersAllocator.
   * @param {object} param0 - The parameters for creating a WorkersAllocator instance.
   * @param {JobRegistry} param0.jobRegistry - The job registry to allocate jobs from.
   * @param {WorkersRegistry} param0.workersRegistry - The workers registry to allocate workers from.
   */
  constructor({ jobRegistry, workersRegistry }) {
    this.jobRegistry = jobRegistry;
    this.workersRegistry = workersRegistry;
  }

  /**
   * Allocates jobs to idle workers.
   *
   * This method continuously checks for available jobs and idle workers, and assigns
   * jobs to workers until there are no more jobs or no more idle workers.
   * @returns {void}
   */
  allocate() {
    while (this.#canAllocate()) {
      this.#allocateWorker();
    }
  }

  /**
   * Allocates a single worker to a job.
   *
   * This method picks a job from the job registry and an idle worker from the workers registry,
   * and assigns the job to the worker.
   * @returns {void}
   */
  #allocateWorker() {
    const job = this.jobRegistry.pick();
    const worker = this.workersRegistry.getIdleWorker();
    worker.assign(job);
  }

  #canAllocate() {
    return this.jobRegistry.hasJob() && this.workersRegistry.hasIdleWorker();
  }
}

export { WorkersAllocator };