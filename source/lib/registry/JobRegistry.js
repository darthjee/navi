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
  #finished;
  #dead;
  #lockedBy;
  #factory;

  /**
   * Creates a new JobRegistry instance with an empty job queue.
   *
   * @param {object} options - The options for the JobRegistry.
   * @param {ClientRegistry} options.clients - The clients to be used by the JobFactory.
   * @param {Queue} [options.queue] - An optional queue to use for enqueued jobs. If not provided, a new Queue will be created.
   * @param {Queue} [options.failed] - An optional queue to use for failed jobs. If not provided, a new Queue will be created.
   * @param {Queue} [options.finished] - An optional queue to use for finished jobs. If not provided, a new Queue will be created.
   * @param {Queue} [options.dead] - An optional queue to use for dead jobs. If not provided, a new Queue will be created.
   * @param {JobFactory} [options.factory] - An optional JobFactory to use for creating jobs. If not provided, a new JobFactory will be created with the provided clients.
   */
  constructor({ queue, failed, finished, dead, clients, factory }) {
    this.#enqueued = queue || new Queue();
    this.#failed = failed || new Queue();
    this.#finished = finished || new IdentifyableCollection();
    this.#dead = dead || new IdentifyableCollection();

    this.#lockedBy = null;
    this.#factory = factory || new JobFactory({ clients });
  }

  report() {
    return {
      enqueued: this.#enqueued.size(),
      failed: this.#failed.size(),
      finished: this.#finished.size(),
      dead: this.#dead.size()
    };
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
   * @param {Job} job - The job to mark as failed.
   * @returns {void}
   */
  fail(job) {
    if (job.exhausted()) {
      this.#dead.push(job);
    } else {
      this.#failed.push(job);
    }
  }

  /**
   * Marks a job as finished.
   * @param {Job} job - The job to mark as finished.
   * @returns {void}
   */
  finish(job) {
    this.#finished.push(job);
  }

  /**
   * Picks (removes and returns) the first job from the queue.
   * @returns {Job|undefined} The first job in the queue, or undefined if empty.
   */
  pick() {
    return this.#enqueued.pick() || this.#failed.pick();
  }

  /**
   * Returns whether the registry has any jobs pending.
   * @returns {boolean} True if there are jobs in the queue, false otherwise.
   */
  hasJob() {
    return this.#enqueued.hasItem() || this.#failed.hasItem();
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
}

export { JobRegistry };
