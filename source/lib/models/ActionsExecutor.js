import { NullResponse } from '../exceptions/NullResponse.js';
import { Logger } from '../utils/logging/Logger.js';

/**
 * Receives an already-parsed response value and dispatches each action for every item.
 *
 * This class is the single place that knows how to handle both array and object responses.
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
   * Normalises the parsed response to an array and dispatches each action per item.
   * @throws {NullResponse} If the parsed response is null.
   */
  execute() {
    if (this.#parsed === null) throw new NullResponse();

    const items = Array.isArray(this.#parsed) ? this.#parsed : [this.#parsed];

    for (const item of items) {
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
