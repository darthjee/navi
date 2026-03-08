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
}

export { JobRegistry };
