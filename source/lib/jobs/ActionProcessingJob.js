import { Job } from '../background/Job.js';
import { Logger } from '../utils/logging/Logger.js';

/**
 * ActionProcessingJob is a Job that processes a single Action for a given item.
 * Unlike ResourceRequestJob, this job is exhausted after the first failure — it has no
 * retry rights.
 * @author darthjee
 */
class ActionProcessingJob extends Job {
  #action;
  #item;

  /**
   * Creates a new ActionProcessingJob instance.
   * @param {object} params - The parameters for creating an ActionProcessingJob instance.
   * @param {string} params.id - The unique identifier for this job.
   * @param {ResourceRequestAction} params.action - The action to execute.
   * @param {object} params.item - The parsed response item to pass to the action.
   */
  constructor({ id, action, item }) {
    super({ id });
    this.#action = action;
    this.#item = item;
  }

  /**
   * Returns the job-specific arguments for serialization.
   * @returns {{ item: object }} The job arguments.
   */
  get arguments() {
    return { item: this.#item };
  }

  /**
   * Returns the maximum number of retries for this job type.
   * ActionProcessingJob is exhausted after the first failure.
   * @returns {number} Always 1.
   * @override
   */
  get maxRetries() {
    return 1;
  }

  /**
   * Performs the action for the given item.
   * @returns {Promise<void>}
   */
  async perform() {
    Logger.debug(`ActionProcessingJob #${this.id} performing`);
    try {
      this.lastError = undefined;
      await this.#action.execute(this.#item);
    } catch (error) {
      this._fail(error);
    }
  }
}

export { ActionProcessingJob };
