import { JobFactory } from '../../../lib/factories/JobFactory.js';
import { Job } from '../../../lib/models/Job.js';
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

  describe('.enqueue', () => {
    it('creates and enqueues a job', () => {
      expect(JobRegistry.hasJob()).toBeFalse();

      const jobAttributes = { resourceRequest, parameters: { id: 20 } };
      const job = JobRegistry.enqueue('ResourceRequestJob', jobAttributes);

      expect(job).toBeInstanceOf(Job);
      expect(JobRegistry.hasJob()).toBeTrue();
    });

    it('passes params to the factory', () => {
      const factory = JobFactory.get('ResourceRequestJob');
      spyOn(factory, 'build').and.callThrough();

      JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {} });

      expect(factory.build).toHaveBeenCalledWith(
        jasmine.objectContaining({ resourceRequest })
      );
    });

    describe('with a different factory key', () => {
      let action;
      let item;
      let actionFactory;

      beforeEach(() => {
        action = jasmine.createSpyObj('action', ['execute']);
        item = { id: 1 };
        JobFactory.build('Action', {});
        actionFactory = JobFactory.get('Action');
      });

      it('creates and enqueues a job', () => {
        expect(JobRegistry.hasJob()).toBeFalse();
        const job = JobRegistry.enqueue('Action', { action, item });
        expect(job).toBeInstanceOf(Job);
        expect(JobRegistry.hasJob()).toBeTrue();
      });

      it('passes params to the named factory', () => {
        spyOn(actionFactory, 'build').and.callThrough();

        JobRegistry.enqueue('Action', { action, item });

        expect(actionFactory.build).toHaveBeenCalledWith(
          jasmine.objectContaining({ action, item })
        );
      });
    });
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
