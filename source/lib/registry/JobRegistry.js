import { LockedByOtherWorker } from '../exceptions/LockedByOtherWorker.js';
import { JobFactory } from '../factories/JobFactory.js';
import { IdentifyableCollection } from '../utils/IdentifyableCollection.js';
import { Queue } from '../utils/Queue.js';

/**
 * JobRegistry manages a queue of jobs for Workers to consume.
 * @author darthjee
 */
class JobRegistry {
  #enqueued;
  #failed;
  #retryQueue;
  #finished;
  #dead;
  #processing;
  #lockedBy;
  #factory;
  #cooldown;

  /**
   * Creates a new JobRegistry instance with an empty job queue.
   *
   * @param {object} options - The options for the JobRegistry.
   * @param {ClientRegistry} options.clients - The clients to be used by the JobFactory.
   * @param {Queue} [options.queue] - An optional queue to use for enqueued jobs. If not provided, a new Queue will be created.
   * @param {Queue} [options.failed] - An optional queue to use for failed jobs. If not provided, a new Queue will be created.
   * @param {Queue} [options.retryQueue] - An optional queue to use for jobs ready to retry. If not provided, a new Queue will be created.
   * @param {IdentifyableCollection} [options.finished] - An optional collection to use for finished jobs. If not provided, a new IdentifyableCollection will be created.
   * @param {IdentifyableCollection} [options.dead] - An optional collection to use for dead jobs. If not provided, a new IdentifyableCollection will be created.
   * @param {IdentifyableCollection} [options.processing] - An optional collection to use for jobs currently being processed. If not provided, a new IdentifyableCollection will be created.
   * @param {JobFactory} [options.factory] - An optional JobFactory to use for creating jobs. If not provided, a new JobFactory will be created with the provided clients.
   * @param {number} [options.cooldown=5000] - Milliseconds a failed job must wait before becoming retryable. Use a negative value to disable the cooldown (e.g. in tests).
   */
  constructor({ queue, failed, retryQueue, finished, dead, processing, clients, factory, cooldown = 5000 }) {
    this.#enqueued = queue || new Queue();
    this.#failed = failed || new Queue();
    this.#retryQueue = retryQueue || new Queue();
    this.#finished = finished || new IdentifyableCollection();
    this.#dead = dead || new IdentifyableCollection();
    this.#processing = processing || new IdentifyableCollection();

    this.#lockedBy = null;
    this.#factory = factory || new JobFactory({ clients });
    this.#cooldown = cooldown;
  }

  /**
   * Enqueues a new job using the JobFactory.
   * @param {object} jobAttributes - The attributes for the job (resourceRequest, parameters, etc).
   * @param {object} jobAttributes.resourceRequest - The resource request associated with the job.
   * @param {object} jobAttributes.parameters - The parameters for the job execution.
   * @returns {Job} The created and enqueued Job instance.
   */
  enqueue({ resourceRequest, parameters } = {}) {
    const job = this.#factory.build({resourceRequest, parameters});
    this.#enqueued.push(job);
    return job;
  }

  /**
   * Marks a job as failed.
   * Removes the job from processing before queuing it for retry or marking it as dead.
   * @param {Job} job - The job to mark as failed.
   * @returns {void}
   */
  fail(job) {
    if (!job) return;
    this.#processing.remove(job.id);
    if (job.exhausted()) {
      this.#dead.push(job);
    } else {
      job.readyBy = Date.now() + this.#cooldown;
      this.#failed.push(job);
    }
  }

  /**
   * Marks a job as finished.
   * Removes the job from processing before adding it to the finished collection.
   * @param {Job} job - The job to mark as finished.
   * @returns {void}
   */
  finish(job) {
    if (!job) return;
    this.#processing.remove(job.id);
    this.#finished.push(job);
  }

  /**
   * Picks (removes and returns) the first job from the enqueued or retryQueue and adds it to processing.
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
   * Promotes jobs from the failed queue to the retryQueue once their cooldown has elapsed.
   * @returns {void}
   */
  promoteReadyJobs() {
    const remaining = [];
    while (this.#failed.hasItem()) {
      const job = this.#failed.pick();
      if (job.isReady()) {
        this.#retryQueue.push(job);
      } else {
        remaining.push(job);
      }
    }
    remaining.forEach(job => this.#failed.push(job));
  }

  /**
   * Returns whether the registry has any jobs pending (including those in cooldown).
   * @returns {boolean} True if any of enqueued, failed, or retryQueue is non-empty.
   */
  hasJob() {
    return this.#enqueued.hasItem() || this.#failed.hasItem() || this.#retryQueue.hasItem();
  }

  /**
   * Returns whether there is a job ready to be picked by a worker right now.
   * @returns {boolean} True if enqueued or retryQueue is non-empty.
   */
  hasReadyJob() {
    return this.#enqueued.hasItem() || this.#retryQueue.hasItem();
  }

  /**
   * Locks the registry for the given worker.
   * If the registry is already locked by another worker, throws LockedByOtherWorker.
   * @param {Worker} worker - The worker attempting to acquire the lock.
   * @returns {void}
   * @throws {LockedByOtherWorker} When the registry is already locked by another worker.
   */
  lock(worker) {
    if (this.#lockedBy === null) {
      this.#lockedBy = worker.id;
    } else {
      throw new LockedByOtherWorker();
    }
  }

  /**
   * Returns whether the given worker holds the lock on this registry.
   * @param {Worker} worker - The worker to check.
   * @returns {boolean} True if the worker holds the lock, false otherwise.
   */
  hasLock(worker) {
    return this.#lockedBy === worker.id;
  }

  /**
   * Returns counts of jobs in each state.
   * @returns {{ enqueued: number, processing: number, failed: number, retryQueue: number, finished: number, dead: number }} Counts of jobs in each state.
   */
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

export { JobRegistry };
