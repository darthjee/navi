import { JobFactory } from '../../../lib/factories/JobFactory.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { Queue } from '../../../lib/utils/collections/Queue.js';

/**
 * Test utility for setting up a JobRegistry with standard collections.
 */
class JobRegistryUtils {
  /**
   * Installs a beforeEach that builds the JobRegistry and an afterEach that resets it.
   * Returns a context object whose collection properties (jobs, retryQueue, finished,
   * processing) are populated before each spec and available for assertions.
   * @returns {{ jobs: Queue, retryQueue: Queue, finished: Queue, processing: IdentifyableCollection }} Context object populated before each spec.
   */
  static setup() {
    const ctx = {};

    beforeEach(() => {
      JobFactory.build('ResourceRequestJob', { attributes: {} });
      ctx.jobs = new Queue();
      ctx.retryQueue = new Queue();
      ctx.finished = new Queue();
      ctx.processing = new IdentifyableCollection();
      JobRegistry.build({
        queue: ctx.jobs,
        retryQueue: ctx.retryQueue,
        finished: ctx.finished,
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
