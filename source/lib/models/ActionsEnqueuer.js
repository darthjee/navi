import { NullResponse } from '../exceptions/NullResponse.js';

/**
 * ActionsEnqueuer enqueues one ActionProcessingJob per (item × action) pair.
 *
 * Mirrors the structure of ActionsExecutor but delegates execution to the job queue
 * instead of running actions inline.
 * @author darthjee
 */
class ActionsEnqueuer {
  #actions;
  #parsed;
  #jobRegistry;

  /**
   * @param {Array} actions List of ResourceRequestAction instances.
   * @param {*} parsed The already-parsed response value (object, array, or null).
   * @param {JobRegistry} jobRegistry The registry used to enqueue action jobs.
   */
  constructor(actions, parsed, jobRegistry) {
    this.#actions = actions;
    this.#parsed = parsed;
    this.#jobRegistry = jobRegistry;
  }

  /**
   * Normalises the parsed response to an array and enqueues one ActionProcessingJob
   * per (item × action) pair.
   * @throws {NullResponse} If the parsed response is null.
   */
  enqueue() {
    if (this.#parsed === null) throw new NullResponse();

    const items = Array.isArray(this.#parsed) ? this.#parsed : [this.#parsed];
    for (const item of items) {
      for (const action of this.#actions) {
        this.#jobRegistry.enqueueAction({ action, item });
      }
    }
  }
}

export { ActionsEnqueuer };
