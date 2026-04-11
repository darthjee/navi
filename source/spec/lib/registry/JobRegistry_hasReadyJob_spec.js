import { JobFactory } from '../../../lib/factories/JobFactory.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { Queue } from '../../../lib/utils/collections/Queue.js';

describe('JobRegistry', () => {
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
  });

  afterEach(() => {
    JobRegistry.reset();
    JobFactory.reset();
  });

  describe('.hasReadyJob', () => {
    describe('when all queues are empty', () => {
      it('returns false', () => {
        expect(JobRegistry.hasReadyJob()).toBeFalse();
      });
    });

    describe('when enqueued has items', () => {
      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
      });

      it('returns true', () => {
        expect(JobRegistry.hasReadyJob()).toBeTrue();
      });
    });

    describe('when only failed has items (cooldown not elapsed)', () => {
      beforeEach(() => {
        JobRegistry.reset();
        JobRegistry.build({ cooldown: 5000 });
        const job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();
        JobRegistry.fail(job);
      });

      it('returns false', () => {
        expect(JobRegistry.hasReadyJob()).toBeFalse();
      });
    });

    describe('when retryQueue has items', () => {
      beforeEach(() => {
        const job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();
        JobRegistry.fail(job);
        JobRegistry.promoteReadyJobs();
      });

      it('returns true', () => {
        expect(JobRegistry.hasReadyJob()).toBeTrue();
      });
    });
  });
});
