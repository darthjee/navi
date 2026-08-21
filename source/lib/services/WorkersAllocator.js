/**
 * WorkersAllocator is responsible for allocating jobs to idle workers.
 *
 * It continuously checks for available jobs and idle workers, and assigns
 * jobs to workers until there are no more jobs or no more idle workers.
 */
class WorkersAllocator {
  #jobRegistry;
  #workersRegistry;

  /**
   * Creates an instance of WorkersAllocator.
   * @param {object} [param0={}] - The parameters for creating a WorkersAllocator instance.
   * @param {JobRegistry} param0.jobRegistry - The job registry to pick and requeue jobs from.
   * @param {WorkersRegistry} param0.workersRegistry - The workers registry to pick idle workers from.
   */
  constructor({ jobRegistry, workersRegistry } = {}) {
    this.#jobRegistry = jobRegistry;
    this.#workersRegistry = workersRegistry;
  }

  /**
   * Allocates jobs to idle workers.
   *
   * This method continuously checks for available jobs and idle workers, and assigns
   * jobs to workers until there are no more jobs or no more idle workers.
   * @returns {void}
   */
  allocate() {
    while (this._canAllocate()) {
      this._allocateNext();
    }
  }

  /**
   * Allocates a single worker to a job.
   *
   * This method picks a job from the job registry and an idle worker from the workers registry,
   * and assigns the job to the worker. If no job is available, returns immediately.
   * If no idle worker is available, the job is re-enqueued.
   * @returns {void}
   */
  _allocateNext() {
    const job = this.#jobRegistry.pick();
    if (!job) return;

    const worker = this.#workersRegistry.getIdleWorker();
    if (!worker) {
      this.#jobRegistry.requeue(job);
      return;
    }

    this._allocateWorkerToJob(worker, job);
  }

  /**
   * Allocates a worker to a job.
   *
   * This method assigns the given job to the given worker and then performs the job.
   * @param {Worker} worker - The worker to allocate the job to.
   * @param {Job} job - The job to be allocated to the worker.
   * @returns {void}
   */
  _allocateWorkerToJob(worker, job) {
    worker.assign(job);
    worker.perform();
  }

  /**
   * Checks if there are available jobs and idle workers to allocate.
   *
   * This method checks if the job registry has any jobs and if the workers registry has any idle workers.
   * @returns {boolean} True if there are available jobs and idle workers, false otherwise.
   */
  _canAllocate() {
    return this.#workersRegistry.hasIdleWorker() && this.#jobRegistry.hasReadyJob();
  }
}

export { WorkersAllocator };