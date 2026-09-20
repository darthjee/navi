import { JobFactory, JobRegistry, IdentifyableCollection, Queue } from 'deku-swarm';
import { ResourceRequestJob } from '../../../lib/jobs/ResourceRequestJob.js';
import { ResourceRequestFactory } from '../factories/ResourceRequestFactory.js';

/**
 * Test utility for setting up a JobRegistry with standard collections.
 */
class JobRegistryUtils {
  /**
   * Installs a beforeEach that builds the JobRegistry and an afterEach that resets it.
   * Returns a context object whose collection properties (jobs, retryQueue, finished,
   * dead, processing) are populated before each spec and available for assertions,
   * together with a `resourceRequest` ready to be used when enqueuing jobs.
   * @returns {{ jobs: Queue, retryQueue: Queue, finished: Queue, dead: IdentifyableCollection, processing: IdentifyableCollection, resourceRequest: ResourceRequest }} Context object populated before each spec.
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
      ctx.resourceRequest = ResourceRequestFactory.build({ url: 'http://example.com' });
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
   * Rebuilds the JobRegistry with default collections and the given cooldown,
   * discarding whatever `setup()` built.
   * @param {object} options - Build options.
   * @param {number} options.cooldown - Cooldown (in ms) applied to failed jobs.
   * @returns {void}
   */
  static rebuild({ cooldown }) {
    JobRegistry.reset();
    JobRegistry.build({ cooldown });
  }

  /**
   * Enqueues a ResourceRequestJob and picks it, moving it to processing.
   * @param {object} [attributes] - Job attributes (defaults to `{ parameters: { value: 1 } }`).
   * @returns {Job} The picked job.
   */
  static enqueueAndPick(attributes = { parameters: { value: 1 } }) {
    JobRegistry.enqueue('ResourceRequestJob', attributes);
    return JobRegistry.pick();
  }

  /**
   * Fails a picked job through the given number of attempts (promoting it back to
   * the retry queue and picking it again between attempts) so that it ends up in the
   * dead collection. Requires a registry built with a non-positive cooldown.
   * @param {Job} job - Picked job to be failed until it is dead.
   * @param {number} [attempts] - How many times the job is failed (defaults to 2).
   * @param {Error} [error] - Error passed to the job (defaults to a new generic Error).
   * @returns {void}
   */
  static failUntilDead(job, attempts = 2, error = new Error()) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      if (attempt > 0) {
        JobRegistry.promoteReadyJobs();
        JobRegistry.pick();
      }
      JobRegistryUtils.failSilently(job, error);
      JobRegistry.fail(job);
    }
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
