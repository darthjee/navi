import { ActionEnqueuer } from './ActionEnqueuer.js';
import { NullResponse } from '../exceptions/NullResponse.js';

/**
 * ActionsEnqueuer enqueues one ActionProcessingJob per (item × action) pair.
 *
 * Mirrors the structure of ActionsExecutor but delegates execution to the job queue
 * instead of running actions inline. Each action is handled by a dedicated
 * ActionEnqueuer that enqueues all items for that action.
 * @author darthjee
 */
class ActionsEnqueuer {
  #actions;
  #items;

  /**
   * @param {Array} actions List of ResourceRequestAction instances.
   * @param {Array} items List of ResponseWrapper instances (one per response item).
   */
  constructor(actions, items) {
    this.#actions = actions;
    this.#items = items;
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
      new ActionEnqueuer(action, this.#items).enqueue();
    }
  }
}

export { ActionsEnqueuer };
