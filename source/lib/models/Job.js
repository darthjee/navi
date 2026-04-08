/**
 * Job is the abstract base class for all units of work processed by a Worker.
 * Subclasses must implement the `perform` method.
 * @author darthjee
 */
class Job {
  #attempts;
  #readyBy;

  /**
   * Creates a new Job instance.
   * @param {object} params - The parameters for creating a Job instance.
   * @param {string} params.id - The unique identifier for this job.
   */
  constructor({ id }) {
    this.id = id;
    this.#attempts = 0;
    this.#readyBy = 0;
  }

  /**
   * Performs the job. Must be overridden by subclasses.
   * @throws {Error} Always throws — subclasses must implement this method.
   * @returns {Promise}
   */
  async perform() {
    throw new Error('You must implement the perform method in a subclass');
  }

  /**
   * Returns the timestamp after which the job is eligible for retry.
   * @returns {number} The readyBy timestamp in milliseconds.
   */
  get readyBy() {
    return this.#readyBy;
  }

  /**
   * Sets the cooldown duration in milliseconds after which the job is eligible for retry.
   * Stores the absolute timestamp (Date.now() + ms) internally.
   * @param {number} ms - Cooldown duration in milliseconds. Use a negative value to mark ready immediately.
   */
  applyCooldown(ms) {
    this.#readyBy = Date.now() + ms;
  }

  /**
   * Checks whether the job's cooldown period has elapsed relative to the given time.
   * @param {number} currentTime - The current timestamp in milliseconds.
   * @returns {boolean} True if the job can be retried at the given time.
   */
  isReadyBy(currentTime) {
    return currentTime >= this.#readyBy;
  }

  /**
   * Checks if the job has been exhausted (i.e., has reached the maximum number of attempts).
   * @returns {boolean} True if the job is exhausted, false otherwise.
   */
  exhausted() {
    return this.#attempts >= 3;
  }

  /**
   * Handles a failed job attempt.
   * @param {Error} error - The error that caused the job to fail.
   * @protected
   */
  _fail(error) {
    this.#attempts += 1;
    this.lastError = error;
    throw error;
  }
}

export { Job };
