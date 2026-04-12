import { NullResponse } from '../exceptions/NullResponse.js';
import { Logger } from '../utils/logging/Logger.js';

/**
 * Receives a list of ResponseWrapper items and dispatches each action for every item.
 *
 * This class is the single place that knows how to handle item iteration.
 * Action-level errors are caught per action so that a failing action does not prevent
 * the remaining actions from executing.
 *
 * TODO: In the future, instead of executing actions synchronously, each action should be
 * enqueued as a special Job. These jobs will not have retry rights (exhausted immediately
 * on first failure).
 * @author darthjee
 */
class ActionsExecutor {
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
   * Dispatches each action per item.
   * @returns {void}
   * @throws {NullResponse} If the items list is null.
   */
  execute() {
    if (this.#items === null) throw new NullResponse();

    for (const item of this.#items) {
      for (const action of this.#actions) {
        try {
          action.execute(item);
        } catch (error) {
          Logger.error(`Action failed: ${error}`);
        }
      }
    }
  }
}

export { ActionsExecutor };
