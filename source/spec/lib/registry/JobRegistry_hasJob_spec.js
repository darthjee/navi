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

  describe('.hasJob', () => {
    describe('when the queue is empty', () => {
      it('returns false', () => {
        expect(JobRegistry.hasJob()).toBeFalse();
      });
    });

    describe('when the queue has jobs', () => {
      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', {});
      });

      it('returns true', () => {
        expect(JobRegistry.hasJob()).toBeTrue();
      });
    });

    describe('when only the retryQueue has items', () => {
      beforeEach(() => {
        const job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();
        JobRegistry.fail(job);
        JobRegistry.promoteReadyJobs();
      });

      it('returns true', () => {
        expect(JobRegistry.hasJob()).toBeTrue();
      });
    });
  });
});
