import { JobFactory } from '../factories/JobFactory.js';
import { IdentifyableCollection } from '../utils/collections/IdentifyableCollection.js';
import { Queue } from '../utils/collections/Queue.js';
import { SortedCollection } from '../utils/collections/SortedCollection.js';

const FAILED_SORT_BY = job => job.readyBy;

/**
 * Holds the actual job queues for the JobRegistry singleton.
 * Not exported — use the static `JobRegistry` facade instead.
 * @author darthjee
 */
class JobRegistryInstance {
  #enqueued;
  #failed;
  #retryQueue;
  #finished;
  #dead;
  #processing;
  #cooldown;
  #maxRetries;

  /**
   * @param {object} [options={}] - Construction options.
   * @param {Queue} [options.queue] - Initial enqueued jobs queue.
   * @param {SortedCollection} [options.failed] - Initial failed jobs collection.
   * @param {Queue} [options.retryQueue] - Initial retry queue.
   * @param {IdentifyableCollection} [options.finished] - Initial finished jobs collection.
   * @param {IdentifyableCollection} [options.dead] - Initial dead jobs collection.
   * @param {IdentifyableCollection} [options.processing] - Initial processing jobs collection.
   * @param {number} [options.cooldown=5000] - Cooldown in milliseconds before a failed job is retried.
   * @param {number} [options.maxRetries=3] - Maximum number of retries before a job is marked dead.
   */
  constructor({ queue, failed, retryQueue, finished, dead, processing, cooldown = 5000, maxRetries = 3 } = {}) {
    this.#enqueued = queue || new Queue();
    this.#failed = failed || new SortedCollection([], { sortBy: FAILED_SORT_BY });
    this.#retryQueue = retryQueue || new Queue();
    this.#finished = finished || new IdentifyableCollection();
    this.#dead = dead || new IdentifyableCollection();
    this.#processing = processing || new IdentifyableCollection();
    this.#cooldown = cooldown;
    this.#maxRetries = maxRetries;
  }

  /**
   * Enqueues a new job using the factory registered under the given key.
   * @param {string} factoryKey - The factory key to use.
   * @param {object} [params={}] - Build params forwarded to the factory.
   * @returns {Job} The created and enqueued Job instance.
   */
  enqueue(factoryKey, params = {}) {
    const job = JobFactory.get(factoryKey).build(params);
    this.#enqueued.push(job);
    return job;
  }

  /**
   * Marks a job as failed.
   * @param {Job} job - The job to mark as failed.
   * @returns {void}
   */
  fail(job) {
    if (!job) return;
    this.#processing.remove(job.id);
    if (job.exhausted(this.#maxRetries)) {
      this.#dead.push(job);
    } else {
      job.applyCooldown(this.#cooldown);
      this.#failed.push(job);
    }
  }

  /**
   * Marks a job as finished.
   * @param {Job} job - The job to mark as finished.
   * @returns {void}
   */
  finish(job) {
    if (!job) return;
    this.#processing.remove(job.id);
    this.#finished.push(job);
  }

  /**
   * Picks (removes and returns) the first ready job and adds it to processing.
   * @returns {Job|undefined} The first available job, or undefined if none are ready.
   */
  pick() {
    const job = this.#enqueued.pick() || this.#retryQueue.pick();
    if (job) {
      this.#processing.push(job);
    }
    return job;
  }

  /**
   * Moves a job from processing back to the enqueued queue.
   * @param {Job} job - The job to re-enqueue.
   * @returns {void}
   */
  requeue(job) {
    if (!job) return;
    this.#processing.remove(job.id);
    this.#enqueued.push(job);
  }

  /**
   * Promotes jobs from the failed queue to the retryQueue once their cooldown has elapsed.
   * @returns {void}
   */
  promoteReadyJobs() {
    const now = Date.now();
    const ready = this.#failed.upTo(now);
    const waiting = this.#failed.after(now);

    this.#failed = new SortedCollection(waiting, { sortBy: FAILED_SORT_BY });
    ready.forEach(job => this.#retryQueue.push(job));
  }

  /**
   * Returns whether the registry has any jobs pending (including those in cooldown).
   * @returns {boolean} True if any of enqueued, failed, or retryQueue is non-empty.
   */
  hasJob() {
    return this.#enqueued.hasAny() || this.#failed.hasAny() || this.#retryQueue.hasAny();
  }

  /**
   * Returns whether there is a job ready to be picked by a worker right now.
   * @returns {boolean} True if enqueued or retryQueue is non-empty.
   */
  hasReadyJob() {
    return this.#enqueued.hasAny() || this.#retryQueue.hasAny();
  }

  /**
   * Returns all jobs in the collection that corresponds to the given status.
   * @param {string} status - The status name ('enqueued', 'processing', 'failed', 'retryQueue', 'finished', 'dead').
   * @returns {{ id: string, status: string, attempts: number }[]} Array of job data objects, or an empty array for unknown status.
   */
  jobsByStatus(status) {
    const collection = this.#collectionsByStatus()[status];
    if (!collection) return [];
    return collection.list().map(job => ({ id: job.id, status, attempts: job._attempts }));
  }

  /**
   * Searches all collections and returns data for the job with the given ID.
   * @param {string} id - The ID of the job to look up.
   * @returns {{ id: string, status: string, attempts: number } | null} The job data, or null if not found.
   */
  jobById(id) {
    const collections = this.#collectionsByStatus();

    for (const status of Object.keys(collections)) {
      const job = collections[status].list().find(j => j.id === id);
      if (job) {
        return { id: job.id, status, attempts: job._attempts };
      }
    }
    return null;
  }

  /**
   * Returns counts of jobs in each state.
   * @returns {{ enqueued: number, processing: number, failed: number, retryQueue: number, finished: number, dead: number }} Counts of jobs in each state.
   */
  stats() {
    return {
      enqueued: this.#enqueued.size(),
      processing: this.#processing.size(),
      failed: this.#failed.size(),
      retryQueue: this.#retryQueue.size(),
      finished: this.#finished.size(),
      dead: this.#dead.size(),
    };
  }

  /**
   * Returns an object mapping each status name to its corresponding collection.
   * @returns {object} A map of status names to collection instances.
   */
  #collectionsByStatus() {
    return {
      enqueued:   this.#enqueued,
      processing: this.#processing,
      failed:     this.#failed,
      retryQueue: this.#retryQueue,
      finished:   this.#finished,
      dead:       this.#dead,
    };
  }
}

export { JobRegistryInstance };
