import { JobFactory } from './JobFactory.js';
import { IdentifyableCollection } from '../collections/IdentifyableCollection.js';
import { Queue } from '../collections/Queue.js';
import { SortedCollection } from '../collections/SortedCollection.js';

const FAILED_SORT_BY = job => job.readyBy;
const PRUNABLE_STATUSES = ['finished', 'dead'];
const isNonNegativeInteger = value => Number.isInteger(value) && value >= 0;

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
  #retention;
  #pruned = { finished: 0, dead: 0 };

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
   * @param {object} [options.retention={}] - Maximum number of jobs kept per terminal status.
   * @param {number} [options.retention.finished] - Max finished jobs kept (non-negative integer).
   * @param {number} [options.retention.dead] - Max dead jobs kept (non-negative integer).
   * @throws {Error} If retention has unknown keys or invalid values.
   */
  constructor({ queue, failed, retryQueue, finished, dead, processing, cooldown = 5000, maxRetries = 3, retention = {} } = {}) {
    JobRegistryInstance.#validateRetention(retention);
    this.#retention = { ...retention };
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
    if (job.exhausted()) {
      job.markEnded();
      this.#dead.push(job);
      this.#enforceRetention('dead');
    } else {
      job.applyCooldown(job.cooldown ?? this.#cooldown);
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
    job.markEnded();
    this.#finished.push(job);
    this.#enforceRetention('finished');
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
   * Moves a job directly to the retry queue, removing it from the failed or dead collection.
   * Returns the job if found and moved, or null if the job is not in a retryable state.
   * @param {string} id - The ID of the job to retry.
   * @returns {Job|null} The job instance, or null if not found in failed or dead.
   */
  retryJob(id) {
    const allFailed = this.#failed.list();
    const failedJob = allFailed.find(j => j.id === id);
    if (failedJob) {
      this.#failed = new SortedCollection(
        allFailed.filter(j => j.id !== id),
        { sortBy: FAILED_SORT_BY }
      );
      this.#retryQueue.push(failedJob);
      return failedJob;
    }

    const deadJob = this.#dead.get(id);
    if (deadJob) {
      this.#dead.remove(id);
      deadJob.clearEnded();
      this.#retryQueue.push(deadJob);
      return deadJob;
    }

    return null;
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
   * Clears all queues (enqueued, retryQueue, failed, finished, and dead), leaving
   * only the processing collection intact.
   * @returns {void}
   */
  clearQueues() {
    this.#enqueued = new Queue();
    this.#retryQueue = new Queue();
    this.#failed = new SortedCollection([], { sortBy: FAILED_SORT_BY });
    this.#finished = new IdentifyableCollection();
    this.#dead = new IdentifyableCollection();
    this.#pruned = { finished: 0, dead: 0 };
  }

  /**
   * Removes finished and/or dead jobs from the registry.
   * With neither `keep` nor `olderThan`, every job of the selected statuses is removed.
   * With both, the union of the two criteria is removed.
   * @param {object} [options={}] - Prune options.
   * @param {string[]} [options.statuses=['finished', 'dead']] - Statuses to prune.
   * @param {number} [options.keep] - Keep only this many most recent jobs (non-negative integer).
   * @param {number} [options.olderThan] - Remove jobs that ended at least this many ms ago.
   * @returns {{ finished: number, dead: number }} Number of jobs removed per status.
   * @throws {Error} If any option is invalid.
   */
  prune({ statuses = PRUNABLE_STATUSES, keep, olderThan } = {}) {
    JobRegistryInstance.#validatePrune({ statuses, keep, olderThan });
    const result = { finished: 0, dead: 0 };
    statuses.forEach(status => {
      result[status] = this.#evict(status, { keep, olderThan });
    });
    return result;
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
   * @returns {object[]} Array of raw job instances, or an empty array for unknown status.
   */
  jobsByStatus(status) {
    const collection = this.#collectionByStatus(status);
    if (!collection) return [];
    return collection.list();
  }

  /**
   * Searches all collections and returns the job and its status for the given ID.
   * @param {string} id - The ID of the job to look up.
   * @returns {{ job: object, status: string } | null} The raw job and its status, or null if not found.
   */
  jobById(id) {
    for (const status of Object.keys(this.#collectionsByStatus())) {
      const job = this.#collectionByStatus(status).findById(id);
      if (job) {
        return { job, status };
      }
    }
    return null;
  }

  /**
   * Returns counts of jobs in each state.
   * @returns {{ enqueued: number, processing: number, failed: number, retryQueue: number, finished: number, dead: number, total: number, pruned: { finished: number, dead: number } }} Counts of jobs in each state, plus total (dead + finished) and the number of jobs pruned so far.
   */
  stats() {
    const dead = this.#dead.size();
    const finished = this.#finished.size();

    return {
      enqueued:   this.#enqueued.size(),
      processing: this.#processing.size(),
      failed:     this.#failed.size(),
      retryQueue: this.#retryQueue.size(),
      finished,
      dead,
      total:      dead + finished,
      pruned:     { ...this.#pruned },
    };
  }

  /**
   * Applies the configured retention limit for a status, if any.
   * @param {string} status - 'finished' or 'dead'.
   * @returns {void}
   */
  #enforceRetention(status) {
    const keep = this.#retention[status];
    if (keep !== undefined) this.#evict(status, { keep });
  }

  /**
   * Evicts jobs of a terminal status: the oldest ones over `keep` plus those that
   * ended at least `olderThan` ms ago (union); with neither, evicts all.
   * The count-only case (`keep` alone) uses `removeOldest` and never copies the collection.
   * @param {string} status - 'finished' or 'dead'.
   * @param {object} criteria - Eviction criteria.
   * @param {number} [criteria.keep] - Max jobs to keep.
   * @param {number} [criteria.olderThan] - Age threshold in milliseconds.
   * @returns {number} The number of jobs removed.
   */
  #evict(status, { keep, olderThan }) {
    const collection = this.#collectionByStatus(status);
    if (keep !== undefined && olderThan === undefined) {
      const removed = collection.removeOldest(collection.size() - keep);
      this.#pruned[status] += removed;
      return removed;
    }

    const jobs = collection.list();
    const unbounded = keep === undefined && olderThan === undefined;
    const doomed = new Set();

    if (unbounded) jobs.forEach(job => doomed.add(job));
    if (keep !== undefined) jobs.slice(0, Math.max(0, jobs.length - keep)).forEach(job => doomed.add(job));
    if (olderThan !== undefined) {
      const cutoff = Date.now() - olderThan;
      jobs.filter(job => job.endedAt !== null && job.endedAt <= cutoff).forEach(job => doomed.add(job));
    }

    doomed.forEach(job => collection.remove(job.id));
    this.#pruned[status] += doomed.size;
    return doomed.size;
  }

  /**
   * Returns the collection corresponding to the given status, or undefined.
   * @param {string} status - The status name.
   * @returns {object|undefined} The collection for the given status, or undefined if unknown.
   */
  #collectionByStatus(status) {
    return this.#collectionsByStatus()[status];
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

  /**
   * Validates the retention option.
   * @param {object} retention - The retention option.
   * @returns {void}
   * @throws {Error} If it has unknown keys or non-negative-integer violations.
   */
  static #validateRetention(retention) {
    Object.entries(retention).forEach(([key, value]) => {
      if (!PRUNABLE_STATUSES.includes(key)) {
        throw new Error(`Invalid retention key: ${key}. Allowed: ${PRUNABLE_STATUSES.join(', ')}`);
      }
      if (!isNonNegativeInteger(value)) {
        throw new Error(`Invalid retention.${key}: must be a non-negative integer`);
      }
    });
  }

  /**
   * Validates the prune options.
   * @param {object} options - The prune options.
   * @param {string[]} options.statuses - Statuses to prune.
   * @param {number} [options.keep] - Max jobs to keep.
   * @param {number} [options.olderThan] - Age threshold in milliseconds.
   * @returns {void}
   * @throws {Error} If any option is invalid.
   */
  static #validatePrune({ statuses, keep, olderThan }) {
    if (!Array.isArray(statuses) || statuses.some(status => !PRUNABLE_STATUSES.includes(status))) {
      throw new Error(`Invalid prune statuses: must be a subset of ${PRUNABLE_STATUSES.join(', ')}`);
    }
    if (keep !== undefined && !isNonNegativeInteger(keep)) {
      throw new Error('Invalid prune keep: must be a non-negative integer');
    }
    if (olderThan !== undefined && !(typeof olderThan === 'number' && olderThan >= 0)) {
      throw new Error('Invalid prune olderThan: must be a non-negative number');
    }
  }
}

export { JobRegistryInstance };
