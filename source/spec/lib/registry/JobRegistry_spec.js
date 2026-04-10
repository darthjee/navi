import { LockedByOtherWorker } from '../../../lib/exceptions/LockedByOtherWorker.js';
import { JobFactory } from '../../../lib/factories/JobFactory.js';
import { Job } from '../../../lib/models/Job.js';
import { Worker } from '../../../lib/models/Worker.js';
import { ClientRegistry } from '../../../lib/registry/ClientRegistry.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';
import { IdentifyableCollection } from '../../../lib/utils/collections/IdentifyableCollection.js';
import { Queue } from '../../../lib/utils/collections/Queue.js';
import { ResourceRequestFactory } from '../../support/factories/ResourceRequestFactory.js';

describe('JobRegistry', () => {
  let registry;
  let resourceRequest;
  let clients;

  let jobs;
  let retryQueue;
  let finished;
  let processing;

  beforeEach(() => {
    clients = new ClientRegistry();
    JobFactory.build('ResourceRequestJob', { attributes: { clients } });
    jobs = new Queue();
    retryQueue = new Queue();
    finished = new Queue();
    processing = new IdentifyableCollection();
    registry = new JobRegistry({ queue: jobs, retryQueue, finished, processing, cooldown: -1 });
    resourceRequest = ResourceRequestFactory.build({ url: 'http://example.com' });
  });

  afterEach(() => {
    JobFactory.reset();
  });

  describe('#enqueue', () => {
    it('creates and enqueues a job', () => {
      expect(registry.hasJob()).toBeFalse();

      const jobAttributes = { resourceRequest, parameters: { id: 20 }, jobRegistry: registry };
      const job = registry.enqueue('ResourceRequestJob', jobAttributes);

      expect(job).toBeInstanceOf(Job);
      expect(registry.hasJob()).toBeTrue();
    });

    it('passes params to the factory', () => {
      const factory = JobFactory.get('ResourceRequestJob');
      spyOn(factory, 'build').and.callThrough();

      registry.enqueue('ResourceRequestJob', { resourceRequest, parameters: {}, jobRegistry: registry });

      expect(factory.build).toHaveBeenCalledWith(
        jasmine.objectContaining({ jobRegistry: registry })
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
        expect(registry.hasJob()).toBeFalse();
        const job = registry.enqueue('Action', { action, item });
        expect(job).toBeInstanceOf(Job);
        expect(registry.hasJob()).toBeTrue();
      });

      it('passes params to the named factory', () => {
        spyOn(actionFactory, 'build').and.callThrough();

        registry.enqueue('Action', { action, item });

        expect(actionFactory.build).toHaveBeenCalledWith(
          jasmine.objectContaining({ action, item })
        );
      });
    });
  });

  describe('#hasJob', () => {
    describe('when the queue is empty', () => {
      it('returns false', () => {
        expect(registry.hasJob()).toBeFalse();
      });
    });

    describe('when the queue has jobs', () => {
      beforeEach(() => {
        registry.enqueue('ResourceRequestJob', {});
      });

      it('returns true', () => {
        expect(registry.hasJob()).toBeTrue();
      });
    });

    describe('when only the retryQueue has items', () => {
      beforeEach(() => {
        const job = registry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        registry.pick();
        registry.fail(job);
        registry.promoteReadyJobs();
      });

      it('returns true', () => {
        expect(registry.hasJob()).toBeTrue();
      });
    });
  });

  describe('#hasReadyJob', () => {
    describe('when all queues are empty', () => {
      it('returns false', () => {
        expect(registry.hasReadyJob()).toBeFalse();
      });
    });

    describe('when enqueued has items', () => {
      beforeEach(() => {
        registry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
      });

      it('returns true', () => {
        expect(registry.hasReadyJob()).toBeTrue();
      });
    });

    describe('when only failed has items (cooldown not elapsed)', () => {
      beforeEach(() => {
        const freshRegistry = new JobRegistry({ cooldown: 5000 });
        const job = freshRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        freshRegistry.pick();
        freshRegistry.fail(job);
        registry = freshRegistry;
      });

      it('returns false', () => {
        expect(registry.hasReadyJob()).toBeFalse();
      });
    });

    describe('when retryQueue has items', () => {
      beforeEach(() => {
        const job = registry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        registry.pick();
        registry.fail(job);
        registry.promoteReadyJobs();
      });

      it('returns true', () => {
        expect(registry.hasReadyJob()).toBeTrue();
      });
    });
  });

  describe('#pick', () => {
    describe('when the queue is empty', () => {
      it('returns undefined', () => {
        expect(registry.pick()).toBeUndefined();
      });

      it('does not add anything to processing', () => {
        registry.pick();

        expect(processing.hasAny()).toBeFalse();
      });
    });

    describe('when the queue has jobs', () => {
      let job1, job2;

      beforeEach(() => {
        job1 = registry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        job2 = registry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
      });

      it('returns the first job', () => {
        expect(registry.pick()).toEqual(job1);
      });

      it('removes the job from the queue', () => {
        registry.pick();

        expect(registry.pick()).toEqual(job2);
      });

      it('decreases the queue size', () => {
        registry.pick();

        expect(registry.hasJob()).toBeTrue();

        registry.pick();

        expect(registry.hasJob()).toBeFalse();
      });

      it('adds the picked job to processing', () => {
        const job = registry.pick();

        expect(processing.has(job.id)).toBeTrue();
      });
    });

    describe('when the queue has a failed job', () => {
      let job1, job2;

      beforeEach(() => {
        job1 = registry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        job2 = registry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
      });

      it('returns the first job', () => {
        expect(registry.pick()).toEqual(job1);
      });

      it('removes the job from the queue', () => {
        registry.pick();

        expect(registry.pick()).toEqual(job2);
      });

      it('decreases the queue size', () => {
        registry.pick();

        expect(registry.hasJob()).toBeTrue();

        registry.pick();

        expect(registry.hasJob()).toBeFalse();
      });
    });

    describe('when the queue has failed and not failed jobs', () => {
      let job1, job2;

      beforeEach(() => {
        registry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        job1 = registry.pick();
        job2 = registry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });
        registry.fail(job1);
        registry.promoteReadyJobs();
      });

      it('returns the first not failed job', () => {
        expect(registry.pick()).toEqual(job2);
      });

      it('removes the job from the queue', () => {
        registry.pick();

        expect(registry.pick()).toEqual(job1);
      });

      it('decreases the queue size', () => {
        registry.pick();

        expect(registry.hasJob()).toBeTrue();

        registry.pick();

        expect(registry.hasJob()).toBeFalse();
      });
    });

    describe('when enqueued is empty and retryQueue has items', () => {
      let failedJob;

      beforeEach(() => {
        failedJob = registry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        registry.pick();
        registry.fail(failedJob);
        registry.promoteReadyJobs();
      });

      it('returns the job from retryQueue', () => {
        expect(registry.pick()).toEqual(failedJob);
      });

      it('adds the job to processing', () => {
        registry.pick();
        expect(processing.has(failedJob.id)).toBeTrue();
      });

      it('empties retryQueue afterwards', () => {
        registry.pick();
        expect(registry.hasReadyJob()).toBeFalse();
      });
    });
  });

  describe('#lock', () => {
    let worker;

    beforeEach(() => {
      worker = new Worker({ id: 1, jobRegistry: registry });
    });

    describe('when the registry is not locked', () => {
      it('sets lockedBy to the worker id', () => {
        registry.lock(worker);

        expect(registry.hasLock(worker)).toBeTrue();
      });
    });

    describe('when the registry is already locked', () => {
      beforeEach(() => {
        registry.lock(worker);
      });

      it('throws LockedByOtherWorker', () => {
        const otherWorker = new Worker({ id: 2, jobRegistry: registry });

        expect(() => registry.lock(otherWorker)).toThrowError(LockedByOtherWorker);
      });
    });
  });

  describe('#hasLock', () => {
    let worker;

    beforeEach(() => {
      worker = new Worker({ id: 1, jobRegistry: registry });
    });

    describe('when the worker holds the lock', () => {
      beforeEach(() => {
        registry.lock(worker);
      });

      it('returns true', () => {
        expect(registry.hasLock(worker)).toBeTrue();
      });
    });

    describe('when another worker holds the lock', () => {
      beforeEach(() => {
        registry.lock(worker);
      });

      it('returns false', () => {
        const otherWorker = new Worker({ id: 2, jobRegistry: registry });

        expect(registry.hasLock(otherWorker)).toBeFalse();
      });
    });

    describe('when the registry is not locked', () => {
      it('returns false', () => {
        expect(registry.hasLock(worker)).toBeFalse();
      });
    });
  });

  describe('#fail', () => {
    it('moves the failed job to the failed queue for later retry', () => {
      const job = registry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });

      const picked = registry.pick();
      expect(picked).toBe(job);

      registry.fail(picked);

      expect(registry.hasJob()).toBeTrue();
      registry.promoteReadyJobs();
      expect(registry.pick()).toEqual(job);
    });

    it('removes the job from processing', () => {
      const job = registry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
      const picked = registry.pick();

      expect(processing.has(picked.id)).toBeTrue();

      registry.fail(job);

      expect(processing.has(picked.id)).toBeFalse();
    });

    describe('when the job is not exhausted', () => {
      it('sets readyBy using the configured cooldown', () => {
        const registryWithCooldown = new JobRegistry({ cooldown: 5000 });
        const j = registryWithCooldown.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        registryWithCooldown.pick();

        const before = Date.now() + 4900;
        registryWithCooldown.fail(j);
        const after = Date.now() + 5100;

        expect(j.readyBy).toBeGreaterThanOrEqual(before);
        expect(j.readyBy).toBeLessThanOrEqual(after);
      });

      it('moves the job to the failed queue, not retryQueue', () => {
        const registryWithCooldown = new JobRegistry({ cooldown: 5000 });
        const j = registryWithCooldown.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
        registryWithCooldown.pick();
        registryWithCooldown.fail(j);

        expect(registryWithCooldown.hasReadyJob()).toBeFalse();
        expect(registryWithCooldown.hasJob()).toBeTrue();
      });
    });
  });

  describe('#promoteReadyJobs', () => {
    let readyJob, waitingJob;

    beforeEach(() => {
      const slowRegistry = new JobRegistry({ cooldown: 5000 });
      readyJob = slowRegistry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
      waitingJob = slowRegistry.enqueue('ResourceRequestJob', { parameters: { value: 2 } });

      slowRegistry.pick();
      slowRegistry.pick();

      slowRegistry.fail(readyJob);
      slowRegistry.fail(waitingJob);

      readyJob.applyCooldown(-1000);
      waitingJob.applyCooldown(10_000);

      registry = slowRegistry;
    });

    it('moves the ready job to retryQueue', () => {
      registry.promoteReadyJobs();

      expect(registry.hasReadyJob()).toBeTrue();
    });

    it('keeps the waiting job in failed queue', () => {
      registry.promoteReadyJobs();

      expect(registry.hasJob()).toBeTrue();
      expect(registry.pick()).toEqual(readyJob);
      expect(registry.pick()).toBeUndefined();
    });

    describe('when called repeatedly', () => {
      it('is idempotent when no new jobs become ready', () => {
        registry.promoteReadyJobs();
        registry.promoteReadyJobs();

        registry.pick();
        expect(registry.pick()).toBeUndefined();
      });
    });
  });

  describe('#finish', () => {
    it('does not re-queue a picked job', () => {
      const job = registry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });

      const picked = registry.pick();
      expect(picked).toBe(job);

      registry.finish(picked);

      expect(registry.hasJob()).toBeFalse();
      expect(registry.pick()).toBeUndefined();
    });

    it('is safe to call with undefined', () => {
      expect(() => registry.finish(undefined)).not.toThrow();
    });

    it('removes the job from processing', () => {
      const job = registry.enqueue('ResourceRequestJob', { parameters: { value: 1 } });
      const picked = registry.pick();

      expect(processing.has(picked.id)).toBeTrue();

      registry.finish(job);

      expect(processing.has(picked.id)).toBeFalse();
    });
  });
});
