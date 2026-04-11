import { JobFactory } from '../../../lib/factories/JobFactory.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { Queue } from '../../../lib/utils/collections/Queue.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';

describe('JobRegistry', () => {
  let resourceRequest;
  let clients;

  let jobs;
  let retryQueue;
  let finished;
  let processing;

  beforeEach(() => {
    JobFactory.build('ResourceRequestJob', { attributes: { clients } });
    jobs = new Queue();
    retryQueue = new Queue();
    finished = new Queue();
    processing = new IdentifyableCollection();
    JobRegistry.build({ queue: jobs, retryQueue, finished, processing, cooldown: -1 });
    resourceRequest = ResourceRequestFactory.build({ url: 'http://example.com' });
  });

  afterEach(() => {
    JobRegistry.reset();
    JobFactory.reset();
  });

  describe('.promoteReadyJobs', () => {
    let readyJob, waitingJob;

    beforeEach(() => {
      JobRegistry.reset();
      JobRegistry.build({ cooldown: 5000 });
      readyJob = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
      waitingJob = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });

      JobRegistry.pick();
      JobRegistry.pick();

      JobRegistry.fail(readyJob);
      JobRegistry.fail(waitingJob);

      readyJob.applyCooldown(-1000);
      waitingJob.applyCooldown(10_000);
    });

    it('moves the ready job to retryQueue', () => {
      JobRegistry.promoteReadyJobs();

      expect(JobRegistry.hasReadyJob()).toBeTrue();
    });

    it('keeps the waiting job in failed queue', () => {
      JobRegistry.promoteReadyJobs();

      expect(JobRegistry.hasJob()).toBeTrue();
      expect(JobRegistry.pick()).toEqual(readyJob);
      expect(JobRegistry.pick()).toBeUndefined();
    });

    describe('when called repeatedly', () => {
      it('is idempotent when no new jobs become ready', () => {
        JobRegistry.promoteReadyJobs();
        JobRegistry.promoteReadyJobs();

        JobRegistry.pick();
        expect(JobRegistry.pick()).toBeUndefined();
      });
    });
  });
});
