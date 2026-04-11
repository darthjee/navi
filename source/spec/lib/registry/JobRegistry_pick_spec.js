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

  describe('.pick', () => {
    describe('when the queue is empty', () => {
      it('returns undefined', () => {
        expect(JobRegistry.pick()).toBeUndefined();
      });

      it('does not add anything to processing', () => {
        JobRegistry.pick();

        expect(processing.hasAny()).toBeFalse();
      });
    });

    describe('when the queue has jobs', () => {
      let job1, job2;

      beforeEach(() => {
        job1 = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        job2 = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
      });

      it('returns the first job', () => {
        expect(JobRegistry.pick()).toEqual(job1);
      });

      it('removes the job from the queue', () => {
        JobRegistry.pick();

        expect(JobRegistry.pick()).toEqual(job2);
      });

      it('decreases the queue size', () => {
        JobRegistry.pick();

        expect(JobRegistry.hasJob()).toBeTrue();

        JobRegistry.pick();

        expect(JobRegistry.hasJob()).toBeFalse();
      });

      it('adds the picked job to processing', () => {
        const job = JobRegistry.pick();

        expect(processing.has(job.id)).toBeTrue();
      });
    });

    describe('when the queue has a failed job', () => {
      let job1, job2;

      beforeEach(() => {
        job1 = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        job2 = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
      });

      it('returns the first job', () => {
        expect(JobRegistry.pick()).toEqual(job1);
      });

      it('removes the job from the queue', () => {
        JobRegistry.pick();

        expect(JobRegistry.pick()).toEqual(job2);
      });

      it('decreases the queue size', () => {
        JobRegistry.pick();

        expect(JobRegistry.hasJob()).toBeTrue();

        JobRegistry.pick();

        expect(JobRegistry.hasJob()).toBeFalse();
      });
    });

    describe('when the queue has failed and not failed jobs', () => {
      let job1, job2;

      beforeEach(() => {
        JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        job1 = JobRegistry.pick();
        job2 = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
        JobRegistry.fail(job1);
        JobRegistry.promoteReadyJobs();
      });

      it('returns the first not failed job', () => {
        expect(JobRegistry.pick()).toEqual(job2);
      });

      it('removes the job from the queue', () => {
        JobRegistry.pick();

        expect(JobRegistry.pick()).toEqual(job1);
      });

      it('decreases the queue size', () => {
        JobRegistry.pick();

        expect(JobRegistry.hasJob()).toBeTrue();

        JobRegistry.pick();

        expect(JobRegistry.hasJob()).toBeFalse();
      });
    });

    describe('when enqueued is empty and retryQueue has items', () => {
      let failedJob;

      beforeEach(() => {
        failedJob = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();
        JobRegistry.fail(failedJob);
        JobRegistry.promoteReadyJobs();
      });

      it('returns the job from retryQueue', () => {
        expect(JobRegistry.pick()).toEqual(failedJob);
      });

      it('adds the job to processing', () => {
        JobRegistry.pick();
        expect(processing.has(failedJob.id)).toBeTrue();
      });

      it('empties retryQueue afterwards', () => {
        JobRegistry.pick();
        expect(JobRegistry.hasReadyJob()).toBeFalse();
      });
    });
  });
});
