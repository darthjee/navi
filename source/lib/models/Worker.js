import { ConsoleLogger } from '../utils/logging/ConsoleLogger.js';

/**
 * Worker processes jobs pulled from a JobRegistry.
 * @author darthjee
 */
class Worker {
  #logger;

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
    this.#logger = new ConsoleLogger();
  }

  /**
   * Assigns a job to this worker.
   * @param {Job} job - The job to assign.
   * @returns {void}
   */
  assign(job) {
    this.job = job;
  }

  /**
   * Performs the assigned job. If no job is assigned, an error is thrown.
   * Any errors that occur during job execution are caught and logged.
   * @returns {Promise<void>}
   * @see Job.perform() for the actual job execution logic.
   */
  async perform() {
    if (!this.job) {
      throw new Error('No job assigned to worker');
    }

    try {
      await this.job.perform();
      this.jobRegistry.finish(this.job);
    } catch (error) {
      this.#logger.error(`Error occurred while performing job: #${this.job.id} - ${error}`);
      this.jobRegistry.fail(this.job);
    } finally {
      this.job = undefined;
      this.workerRegistry.setIdle(this.id);
    }
  }
}

export { Worker };
