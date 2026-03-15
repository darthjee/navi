/**
 * Worker processes jobs pulled from a JobRegistry.
 * @author darthjee
 */
class Worker {
  /**
   * Creates a new Worker instance.
   * @param {object} params - The parameters for creating a Worker instance.
   * @param {string|number} params.id - The unique identifier for this worker.
   * @param {JobRegistry} params.jobRegistry - The job registry to pull jobs from.
   * @param {WorkersRegistry} params.workerRegistry - The worker registry that manages this worker.
   */
  constructor({ id, jobRegistry, workerRegistry }) {
    this.id = id;
    this.jobRegistry = jobRegistry;
    this.workerRegistry = workerRegistry;
  }

  assing(job) {
    this.job = job;
  }
}

export { Worker };
