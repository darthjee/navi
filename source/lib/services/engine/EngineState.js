/**
 * EngineState encapsulates the engine status state machine and its predicates,
 * keeping the raw status value as internal plumbing.
 * @author darthjee
 */
class EngineState {
  #status;

  /**
   * Returns the current status string.
   * @returns {string|undefined} The current status, or undefined before anything has run.
   */
  get() {
    return this.#status;
  }

  /**
   * Sets the status string.
   * @param {string} value - The new status value.
   * @returns {void}
   */
  set(value) {
    this.#status = value;
  }

  /**
   * Returns true if the engine is currently running.
   * @returns {boolean} True if the current status is 'running'.
   */
  isRunning() {
    return this.#status === 'running';
  }

  /**
   * Returns true if the engine is currently paused.
   * @returns {boolean} True if the current status is 'paused'.
   */
  isPaused() {
    return this.#status === 'paused';
  }

  /**
   * Returns true if the engine is currently stopped.
   * @returns {boolean} True if the current status is 'stopped'.
   */
  isStopped() {
    return this.#status === 'stopped';
  }
}

export { EngineState };
