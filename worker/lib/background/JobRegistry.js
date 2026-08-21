import { JobRegistryInstance } from './JobRegistryInstance.js';

/**
 * JobRegistry is a static singleton facade for managing the application's job queues.
 *
 * Call `JobRegistry.build(options)` once during application bootstrap.
 * Use `JobRegistry.reset()` in tests to restore a clean state between examples.
 * @author darthjee
 */
class JobRegistry {
  static #instance = null;

  /**
   * Creates and stores the singleton instance.
   * @param {object} [options={}] - Forwarded to `JobRegistryInstance` constructor.
   * @returns {JobRegistryInstance} The created instance.
   * @throws {Error} If `build()` has already been called without a preceding `reset()`.
   */
  static build(options = {}) {
    if (JobRegistry.#instance) {
      throw new Error('JobRegistry.build() has already been called. Call reset() first.');
    }
    JobRegistry.#instance = new JobRegistryInstance(options);
    return JobRegistry.#instance;
  }

  /**
   * Destroys the singleton instance. Intended for test teardown.
   * @returns {void}
   */
  static reset() {
    JobRegistry.#instance = null;
  }

  /**
   * Clears all pending queues (enqueued, retryQueue, and failed).
   * @returns {void}
   */
  static clearQueues() {
    return JobRegistry.#getInstance().clearQueues();
  }

  /**
   * Enqueues a new job using the factory registered under the given key.
   * @param {string} factoryKey - The factory key to use.
   * @param {object} [params={}] - Build params forwarded to the factory.
   * @returns {Job} The created and enqueued Job instance.
   */
  static enqueue(factoryKey, params = {}) {
    return JobRegistry.#getInstance().enqueue(factoryKey, params);
  }

  /**
   * Marks a job as failed.
   * @param {Job} job - The job to mark as failed.
   * @returns {void}
   */
  static fail(job) {
    return JobRegistry.#getInstance().fail(job);
  }

  /**
   * Marks a job as finished.
   * @param {Job} job - The job to mark as finished.
   * @returns {void}
   */
  static finish(job) {
    return JobRegistry.#getInstance().finish(job);
  }

  /**
   * Picks the next ready job and moves it to processing.
   * @returns {Job|undefined} The next ready job, or undefined if none are ready.
   */
  static pick() {
    return JobRegistry.#getInstance().pick();
  }

  /**
   * Moves a job from processing back to the enqueued queue.
   * @param {Job} job - The job to re-enqueue.
   * @returns {void}
   */
  static requeue(job) {
    return JobRegistry.#getInstance().requeue(job);
  }

  /**
   * Moves a job directly to the retry queue, removing it from the failed or dead collection.
   * @param {string} id - The ID of the job to retry.
   * @returns {Job|null} The job if found and moved, or null if not in a retryable state.
   */
  static retryJob(id) {
    return JobRegistry.#getInstance().retryJob(id);
  }

  /**
   * Promotes cooling-down failed jobs that are ready to retry.
   * @returns {void}
   */
  static promoteReadyJobs() {
    return JobRegistry.#getInstance().promoteReadyJobs();
  }

  /**
   * Returns whether any jobs exist (including those in cooldown).
   * @returns {boolean} True if any jobs exist.
   */
  static hasJob() {
    return JobRegistry.#getInstance().hasJob();
  }

  /**
   * Returns whether any jobs are immediately ready to be picked.
   * @returns {boolean} True if any jobs are ready.
   */
  static hasReadyJob() {
    return JobRegistry.#getInstance().hasReadyJob();
  }

  /**
   * Returns all jobs in the given status collection.
   * @param {string} status - The status name to filter by.
   * @returns {object[]} Array of raw job instances, or an empty array for unknown status.
   */
  static jobsByStatus(status) {
    return JobRegistry.#getInstance().jobsByStatus(status);
  }

  /**
   * Searches all collections and returns the job and its status for the given ID.
   * @param {string} id - The ID of the job to look up.
   * @returns {{ job: object, status: string } | null} The raw job and its status, or null if not found.
   */
  static jobById(id) {
    return JobRegistry.#getInstance().jobById(id);
  }

  /**
   * Returns counts of jobs in each state.
   * @returns {{ enqueued: number, processing: number, failed: number, retryQueue: number, finished: number, dead: number, total: number }} Job counts per state, plus total (dead + finished).
   */
  static stats() {
    return JobRegistry.#getInstance().stats();
  }

  /**
   * Returns the singleton instance, throwing if not yet built.
   * @returns {JobRegistryInstance} The singleton instance.
   * @throws {Error} If `build()` has not been called.
   */
  static #getInstance() {
    if (!JobRegistry.#instance) {
      throw new Error('JobRegistry has not been built. Call JobRegistry.build() first.');
    }
    return JobRegistry.#instance;
  }
}

export { JobRegistry };
