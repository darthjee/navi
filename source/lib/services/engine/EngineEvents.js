import { EventEmitter } from 'events';

/**
 * EngineEvents is a singleton event bus for engine lifecycle transitions.
 * Components subscribe via `EngineEvents.on(name, handler)` and the engine
 * fires events via `EngineEvents.emit(name)`.
 *
 * Supported event names: 'stop', 'start', 'restart', 'reset'.
 * @author darthjee
 */
class EngineEvents {
  static #emitter = new EventEmitter();

  /**
   * Fires the named event, invoking all registered listeners synchronously.
   * @param {string} eventName - The event to fire.
   * @returns {void}
   */
  static emit(eventName) {
    EngineEvents.#emitter.emit(eventName);
  }

  /**
   * Registers a listener for the named event.
   * @param {string} eventName - The event to listen for.
   * @param {Function} handler - The callback to invoke when the event fires.
   * @returns {void}
   */
  static on(eventName, handler) {
    EngineEvents.#emitter.on(eventName, handler);
  }

  /**
   * Removes all registered listeners. Intended for test teardown.
   * @returns {void}
   */
  static reset() {
    EngineEvents.#emitter.removeAllListeners();
  }
}

export { EngineEvents };
