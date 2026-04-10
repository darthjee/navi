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
  #parsed;

  /**
   * @param {Array} actions List of ResourceRequestAction instances.
   * @param {*} parsed The already-parsed response value (object, array, or null).
   */
  constructor(actions, parsed) {
    this.#actions = actions;
    this.#parsed = parsed;
  }

  /**
   * Normalises the parsed response to an array and enqueues one ActionProcessingJob
   * per (action × item) pair, delegating per-action item enqueueing to ActionEnqueuer.
   * @throws {NullResponse} If the parsed response is null.
   */
  enqueue() {
    if (this.#parsed === null) throw new NullResponse();

    const items = Array.isArray(this.#parsed) ? this.#parsed : [this.#parsed];
    for (const action of this.#actions) {
      new ActionEnqueuer(action, items).enqueue();
    }
  }
}

export { ActionsEnqueuer };
