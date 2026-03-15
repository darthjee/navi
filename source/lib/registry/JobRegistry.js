import { LockedByOtherWorker } from '../exceptions/LockedByOtherWorker.js';

/**
 * JobRegistry manages a queue of jobs for Workers to consume.
 * @author darthjee
 */
class JobRegistry {
  /**
   * Creates a new JobRegistry instance with an empty job queue.
   */
  constructor() {
    this.jobs = [];
    this.failedJobs = [];
    this.lockedBy = null;
  }

  /**
   * Pushes a job onto the end of the queue.
   * @param {Job} job - The job to add to the queue.
   * @returns {void}
   */
  push(job) {
    this.jobs.push(job);
  }

  /**
   * Marks a job as failed.
   * @param {Job} job - The job to mark as failed.
   * @returns {void}
   */
  fail(job) {
    this.failedJobs.push(job);
  }

  /**
   * Picks (removes and returns) the first job from the queue.
   * @returns {Job|undefined} The first job in the queue, or undefined if empty.
   */
  pick() {
    return this.jobs.shift();
  }

  /**
   * Returns whether the registry has any jobs pending.
   * @returns {boolean} True if there are jobs in the queue, false otherwise.
   */
  hasJob() {
    return this.jobs.length > 0;
  }

  /**
   * Locks the registry for the given worker.
   * If the registry is already locked by another worker, throws LockedByOtherWorker.
   * @param {Worker} worker - The worker attempting to acquire the lock.
   * @returns {void}
   * @throws {LockedByOtherWorker} When the registry is already locked by another worker.
   */
  lock(worker) {
    if (this.lockedBy === null) {
      this.lockedBy = worker.id;
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
    return this.lockedBy === worker.id;
  }
}

export { JobRegistry };
