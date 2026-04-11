import { JobRegistry } from '../registry/JobRegistry.js';
import { WorkersRegistry } from '../registry/WorkersRegistry.js';
import { Logger } from '../utils/logging/Logger.js';

/**
 * Worker processes jobs pulled from a JobRegistry.
 * @author darthjee
 */
class Worker {
  /**
   * Creates a new Worker instance.
   * @param {object} params - The parameters for creating a Worker instance.
   * @param {string|number} params.id - The unique identifier for this worker.
   */
  constructor({ id }) {
    this.id = id;
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
      JobRegistry.finish(this.job);
    } catch (error) {
      Logger.error(`Error occurred while performing job: #${this.job.id} - ${error}`);
      JobRegistry.fail(this.job);
    } finally {
      this.job = undefined;
      WorkersRegistry.setIdle(this.id);
    }
  }
}

export { Worker };
