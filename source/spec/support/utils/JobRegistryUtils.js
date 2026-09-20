import { JobFactory, JobRegistry, IdentifyableCollection, Queue } from 'deku-swarm';
import { ResourceRequestJob } from '../../../lib/jobs/ResourceRequestJob.js';

/**
 * Test utility for setting up a JobRegistry with standard collections.
 */
class JobRegistryUtils {
  /**
   * Installs a beforeEach that builds the JobRegistry and an afterEach that resets it.
   * Returns a context object whose collection properties (jobs, retryQueue, finished,
   * dead, processing) are populated before each spec and available for assertions.
   * @returns {{ jobs: Queue, retryQueue: Queue, finished: Queue, dead: IdentifyableCollection, processing: IdentifyableCollection }} Context object populated before each spec.
   */
  static setup() {
    const ctx = {};

    beforeEach(() => {
      JobFactory.build('ResourceRequestJob', { klass: ResourceRequestJob, attributes: {} });
      ctx.jobs = new Queue();
      ctx.retryQueue = new Queue();
      ctx.finished = new Queue();
      ctx.dead = new IdentifyableCollection();
      ctx.processing = new IdentifyableCollection();
      JobRegistry.build({
        queue: ctx.jobs,
        retryQueue: ctx.retryQueue,
        finished: ctx.finished,
        dead: ctx.dead,
        processing: ctx.processing,
        cooldown: -1,
      });
    });

    afterEach(() => {
      JobRegistry.reset();
      JobFactory.reset();
    });

    return ctx;
  }

  /**
   * Fails the job once, swallowing the error the job throws when its retries are exhausted.
   * @param {Job} job - Job to be failed.
   * @param {Error} [error] - Error passed to the job (defaults to a new generic Error).
   * @returns {void}
   */
  static failSilently(job, error = new Error()) {
    try {
      job._fail(error);
    } catch {
      // expected: the job throws once its retries are exhausted
    }
  }

  /**
   * Fails the job repeatedly so that it exhausts its retries, swallowing the thrown errors.
   * @param {Job} job - Job to be exhausted.
   * @param {number} [times] - How many times the job is failed (defaults to 3).
   * @param {Error} [error] - Error passed to the job (defaults to a new generic Error).
   * @returns {void}
   */
  static exhaust(job, times = 3, error = new Error()) {
    for (let i = 0; i < times; i += 1) {
      JobRegistryUtils.failSilently(job, error);
    }
  }
}

export { JobRegistryUtils };
