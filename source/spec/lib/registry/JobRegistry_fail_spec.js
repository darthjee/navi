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

  describe('.fail', () => {
    it('moves the failed job to the failed queue for later retry', () => {
      const job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });

      const picked = JobRegistry.pick();
      expect(picked).toBe(job);

      JobRegistry.fail(picked);

      expect(JobRegistry.hasJob()).toBeTrue();
      JobRegistry.promoteReadyJobs();
      expect(JobRegistry.pick()).toEqual(job);
    });

    it('removes the job from processing', () => {
      const job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
      const picked = JobRegistry.pick();

      expect(processing.has(picked.id)).toBeTrue();

      JobRegistry.fail(job);

      expect(processing.has(picked.id)).toBeFalse();
    });

    describe('when the job is not exhausted', () => {
      it('sets readyBy using the configured cooldown', () => {
        JobRegistry.reset();
        JobRegistry.build({ cooldown: 5000 });
        const j = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();

        const before = Date.now() + 4900;
        JobRegistry.fail(j);
        const after = Date.now() + 5100;

        expect(j.readyBy).toBeGreaterThanOrEqual(before);
        expect(j.readyBy).toBeLessThanOrEqual(after);
      });

      it('moves the job to the failed queue, not retryQueue', () => {
        JobRegistry.reset();
        JobRegistry.build({ cooldown: 5000 });
        const j = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();
        JobRegistry.fail(j);

        expect(JobRegistry.hasReadyJob()).toBeFalse();
        expect(JobRegistry.hasJob()).toBeTrue();
      });
    });
  });
});
