import { ActionEnqueuer } from './ActionEnqueuer.js';
import { NullResponse } from '../exceptions/NullResponse.js';

/**
 * ActionsEnqueuer enqueues one ActionProcessingJob per (item × action) pair.
 *
 * Delegates execution to the job queue instead of running actions inline.
 * Each action is handled by a dedicated ActionEnqueuer that enqueues all items for that action.
 * @author darthjee
 */
class ActionsEnqueuer {
  #actions;
  #items;
  #jobRegistry;

  /**
   * @param {Array} actions List of ResourceRequestAction instances.
   * @param {Array} items List of ResponseWrapper instances (one per response item).
   * @param {object} [jobRegistry] The job registry to enqueue jobs to. Defaults to global JobRegistry.
   */
  constructor(actions, items, jobRegistry) {
    this.#actions = actions;
    this.#items = items;
    this.#jobRegistry = jobRegistry;
  }

  /**
   * Enqueues one ActionProcessingJob per (action × item) pair,
   * delegating per-action item enqueueing to ActionEnqueuer.
   * @returns {void}
   * @throws {NullResponse} If the items list is null.
   */
  enqueue() {
    if (this.#items === null) throw new NullResponse();

    for (const action of this.#actions) {
      new ActionEnqueuer(action, this.#items, this.#jobRegistry).enqueue();
    }
  }
}

export { ActionsEnqueuer };
