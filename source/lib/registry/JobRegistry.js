import { JobFactory } from '../factories/JobFactory.js';
import { IdentifyableCollection } from '../utils/collections/IdentifyableCollection.js';
import { Queue } from '../utils/collections/Queue.js';
import { SortedCollection } from '../utils/collections/SortedCollection.js';

const FAILED_SORT_BY = job => job.readyBy;

/**
 * Internal singleton instance that holds the actual job queues.
 * Not exported — use the static `JobRegistry` facade instead.
 */
class JobRegistryInstance {
  #enqueued;
  #failed;
  #retryQueue;
  #finished;
  #dead;
  #processing;
  #cooldown;

  /**
   * @param {object} [options={}]
   * @param {Queue} [options.queue]
   * @param {SortedCollection} [options.failed]
   * @param {Queue} [options.retryQueue]
   * @param {IdentifyableCollection} [options.finished]
   * @param {IdentifyableCollection} [options.dead]
   * @param {IdentifyableCollection} [options.processing]
   * @param {number} [options.cooldown=5000]
   */
  constructor({ queue, failed, retryQueue, finished, dead, processing, cooldown = 5000 } = {}) {
    this.#enqueued   = queue      || new Queue();
    this.#failed     = failed     || new SortedCollection([], { sortBy: FAILED_SORT_BY });
    this.#retryQueue = retryQueue || new Queue();
    this.#finished   = finished   || new IdentifyableCollection();
    this.#dead       = dead       || new IdentifyableCollection();
    this.#processing = processing || new IdentifyableCollection();
    this.#cooldown   = cooldown;
  }

  enqueue(factoryKey, params = {}) {
    const job = JobFactory.get(factoryKey).build(params);
    this.#enqueued.push(job);
    return job;
  }

  fail(job) {
    if (!job) return;
    this.#processing.remove(job.id);
    if (job.exhausted()) {
      this.#dead.push(job);
    } else {
      job.applyCooldown(this.#cooldown);
      this.#failed.push(job);
    }
  }

  finish(job) {
    if (!job) return;
    this.#processing.remove(job.id);
    this.#finished.push(job);
  }

  pick() {
    const job = this.#enqueued.pick() || this.#retryQueue.pick();
    if (job) {
      this.#processing.push(job);
    }
    return job;
  }

  promoteReadyJobs() {
    const now = Date.now();
    const ready   = this.#failed.upTo(now);
    const waiting = this.#failed.after(now);

    this.#failed = new SortedCollection(waiting, { sortBy: FAILED_SORT_BY });
    ready.forEach(job => this.#retryQueue.push(job));
  }

  hasJob() {
    return this.#enqueued.hasItem() || this.#failed.hasItem() || this.#retryQueue.hasItem();
  }

  hasReadyJob() {
    return this.#enqueued.hasItem() || this.#retryQueue.hasItem();
  }

  stats() {
    return {
      enqueued:   this.#enqueued.size(),
      processing: this.#processing.size(),
      failed:     this.#failed.size(),
      retryQueue: this.#retryQueue.size(),
      finished:   this.#finished.size(),
      dead:       this.#dead.size(),
    };
  }
}

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

  static #getInstance() {
    if (!JobRegistry.#instance) {
      throw new Error('JobRegistry has not been built. Call JobRegistry.build() first.');
    }
    return JobRegistry.#instance;
  }

  /**
   * Enqueues a new job using the factory registered under the given key.
   * @param {string} factoryKey
   * @param {object} [params={}]
   * @returns {Job}
   */
  static enqueue(factoryKey, params = {}) { return JobRegistry.#getInstance().enqueue(factoryKey, params); }

  /**
   * Marks a job as failed.
   * @param {Job} job
   * @returns {void}
   */
  static fail(job) { return JobRegistry.#getInstance().fail(job); }

  /**
   * Marks a job as finished.
   * @param {Job} job
   * @returns {void}
   */
  static finish(job) { return JobRegistry.#getInstance().finish(job); }

  /**
   * Picks the next ready job and moves it to processing.
   * @returns {Job|undefined}
   */
  static pick() { return JobRegistry.#getInstance().pick(); }

  /**
   * Promotes cooling-down failed jobs that are ready to retry.
   * @returns {void}
   */
  static promoteReadyJobs() { return JobRegistry.#getInstance().promoteReadyJobs(); }

  /**
   * Returns whether any jobs exist (including those in cooldown).
   * @returns {boolean}
   */
  static hasJob() { return JobRegistry.#getInstance().hasJob(); }

  /**
   * Returns whether any jobs are immediately ready to be picked.
   * @returns {boolean}
   */
  static hasReadyJob() { return JobRegistry.#getInstance().hasReadyJob(); }

  /**
   * Returns counts of jobs in each state.
   * @returns {{ enqueued: number, processing: number, failed: number, retryQueue: number, finished: number, dead: number }}
   */
  static stats() { return JobRegistry.#getInstance().stats(); }
}

export { JobRegistry };
