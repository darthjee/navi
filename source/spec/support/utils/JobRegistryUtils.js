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
}

export { JobRegistryUtils };
