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

  describe('.finish', () => {
    it('does not re-queue a picked job', () => {
      const job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });

      const picked = JobRegistry.pick();
      expect(picked).toBe(job);

      JobRegistry.finish(picked);

      expect(JobRegistry.hasJob()).toBeFalse();
      expect(JobRegistry.pick()).toBeUndefined();
    });

    it('is safe to call with undefined', () => {
      expect(() => JobRegistry.finish(undefined)).not.toThrow();
    });

    it('removes the job from processing', () => {
      const job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
      const picked = JobRegistry.pick();

      expect(processing.has(picked.id)).toBeTrue();

      JobRegistry.finish(job);

      expect(processing.has(picked.id)).toBeFalse();
    });
  });
});
