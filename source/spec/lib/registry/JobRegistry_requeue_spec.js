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

  describe('.requeue', () => {
    describe('when the job is in processing', () => {
      let job;

      beforeEach(() => {
        job = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        JobRegistry.pick();
      });

      it('removes the job from processing', () => {
        expect(processing.has(job.id)).toBeTrue();

        JobRegistry.requeue(job);

        expect(processing.has(job.id)).toBeFalse();
      });

      it('adds the job back to the enqueued queue', () => {
        JobRegistry.requeue(job);

        expect(JobRegistry.hasReadyJob()).toBeTrue();
      });

      it('allows the job to be picked again', () => {
        JobRegistry.requeue(job);

        expect(JobRegistry.pick()).toEqual(job);
      });
    });

    describe('when there are multiple jobs', () => {
      let job1, job2;

      beforeEach(() => {
        job1 = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        job2 = JobRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
        JobRegistry.pick();
      });

      it('requeues the job after existing enqueued jobs', () => {
        JobRegistry.requeue(job1);

        expect(JobRegistry.pick()).toEqual(job2);
        expect(JobRegistry.pick()).toEqual(job1);
      });
    });

    describe('when called with null', () => {
      it('does not throw', () => {
        expect(() => JobRegistry.requeue(null)).not.toThrow();
      });
    });

    describe('when called with undefined', () => {
      it('does not throw', () => {
        expect(() => JobRegistry.requeue(undefined)).not.toThrow();
      });
    });
  });
});
