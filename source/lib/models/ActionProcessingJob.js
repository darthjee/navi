import { Job } from './Job.js';

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
   * Performs the action for the given item.
   * @returns {Promise<void>}
   */
  async perform() {
    try {
      this.lastError = undefined;
      await this.#action.execute(this.#item);
    } catch (error) {
      this._fail(error);
    }
  }

  /**
   * Returns true after the first failed attempt — action jobs have no retry rights.
   * @returns {boolean} True if the job has failed at least once.
   * @override
   */
  exhausted() {
    return this._attempts >= 1;
  }
}

export { ActionProcessingJob };
